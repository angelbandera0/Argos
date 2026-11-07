import type { ReviewLine } from "@/core/application/ports/order-repository";
import type { Actor } from "@/core/domain/actor";
import { NotFound, RuleViolation } from "@/core/domain/errors";
import { normalizeName } from "@/core/domain/name";
import { validateOrderLine, validateReparto, type LineInput } from "@/core/domain/orders";
import { qty } from "@/core/domain/stock";
import { loadOrder, requireBuyer, requireOrderSpecial, requireReviewer, requireStatus, resolveOrderScope, type OrderDeps } from "./shared";

type Ctx = { companyId?: string };

export function makeCreateOrder(deps: OrderDeps) {
  return async (
    actor: Actor,
    input: Ctx & { currencyId?: string; note?: string; lines: (LineInput & { productId: string; assignmentId?: string })[] },
  ): Promise<string> => {
    const scope = await resolveOrderScope(deps, actor, input);
    requireOrderSpecial(scope, "build_orders");
    if (input.lines.length === 0) throw new RuleViolation("EMPTY_ORDER");
    const lines = input.lines.map((l) => {
      validateOrderLine(l);
      return { productId: l.productId, dest: l.dest, storeId: l.storeId, qty: l.qty, unit: normalizeName(l.unit), content: l.content, assignmentId: l.assignmentId, plan: l.plan };
    });
    const note = input.note === undefined ? "" : normalizeName(input.note);
    return deps.orders.create({ currencyId: input.currencyId, note: note || undefined, lines });
  };
}

export function makeAssignBuyer(deps: OrderDeps) {
  return async (actor: Actor, input: Ctx & { orderId: string; buyerId: string }): Promise<void> => {
    const scope = await resolveOrderScope(deps, actor, input);
    requireOrderSpecial(scope, "build_orders");
    const order = await loadOrder(deps, scope, input.orderId);
    requireStatus(order, "open", "returned");
    if (!(await deps.orders.isEligibleBuyer(scope.companyId, input.buyerId))) throw new RuleViolation("BUYER_NOT_ELIGIBLE");
    await deps.orders.assignBuyer(order.id, input.buyerId);
  };
}

export function makeRegisterPurchase(deps: OrderDeps) {
  return async (
    actor: Actor,
    input: Ctx & { orderId: string; lines: { lineId: string; qtyBought: number; unitCost: number }[]; amountGiven?: number },
  ): Promise<void> => {
    const scope = await resolveOrderScope(deps, actor, input);
    const order = await loadOrder(deps, scope, input.orderId);
    requireBuyer(scope, actor, order);
    requireStatus(order, "open", "returned");
    if ((input.amountGiven !== undefined && input.amountGiven < 0) || input.lines.some((l) => l.qtyBought < 0 || l.unitCost < 0)) {
      throw new RuleViolation("INVALID_QUANTITY");
    }
    if (input.lines.some((l) => !order.lines.some((x) => x.id === l.lineId))) throw new NotFound();
    await deps.orders.registerPurchase({ orderId: order.id, lines: input.lines, amountGiven: input.amountGiven });
  };
}

/** Sends the purchase to review; returns delivered / spent / leftover. */
export function makeSubmitReview(deps: OrderDeps) {
  return async (actor: Actor, input: Ctx & { orderId: string }) => {
    const scope = await resolveOrderScope(deps, actor, input);
    const order = await loadOrder(deps, scope, input.orderId);
    requireBuyer(scope, actor, order);
    requireStatus(order, "open", "returned");
    if (order.lines.some((l) => l.qtyBought === null)) throw new RuleViolation("PURCHASE_INCOMPLETE");
    return deps.orders.submitReview(order.id);
  };
}

export function makeSaveReview(deps: OrderDeps) {
  return async (actor: Actor, input: Ctx & { orderId: string; lines: { lineId: string; qtyReceived: number }[] }): Promise<void> => {
    const scope = await resolveOrderScope(deps, actor, input);
    const order = await loadOrder(deps, scope, input.orderId);
    requireReviewer(scope, actor, order);
    requireStatus(order, "in_review");
    if (input.lines.some((l) => qty(l.qtyReceived) < 0)) throw new RuleViolation("INVALID_QUANTITY");
    if (input.lines.some((l) => !order.lines.some((x) => x.id === l.lineId))) throw new NotFound();
    await deps.orders.saveReview(order.id, input.lines);
  };
}

/** Confirms: only what was received enters stock; direct lines must be split among stores. */
export function makeConfirmOrder(deps: OrderDeps) {
  return async (actor: Actor, input: Ctx & { orderId: string; lines?: ReviewLine[] }): Promise<void> => {
    const scope = await resolveOrderScope(deps, actor, input);
    const order = await loadOrder(deps, scope, input.orderId);
    requireReviewer(scope, actor, order);
    requireStatus(order, "in_review");
    const overrides = input.lines ?? [];
    if (overrides.some((o) => !order.lines.some((l) => l.id === o.lineId))) throw new NotFound();
    for (const l of order.lines) {
      const o = overrides.find((x) => x.lineId === l.id);
      const received = o?.qtyReceived ?? l.qtyReceived ?? l.qtyBought ?? 0;
      if (qty(received) < 0) throw new RuleViolation("INVALID_QUANTITY");
      validateReparto(l.dest, received, o?.reparto);
    }
    await deps.orders.confirm(order.id, overrides);
  };
}

export function makeReturnOrder(deps: OrderDeps) {
  return async (actor: Actor, input: Ctx & { orderId: string; note: string }): Promise<void> => {
    const scope = await resolveOrderScope(deps, actor, input);
    const order = await loadOrder(deps, scope, input.orderId);
    requireReviewer(scope, actor, order);
    requireStatus(order, "in_review");
    const note = normalizeName(input.note);
    if (note.length < 3 || note.length > 500) throw new RuleViolation("NOTE_REQUIRED");
    await deps.orders.returnOrder(order.id, note);
  };
}

/** A fulfilled order is only corrected through a reasoned adjustment linked to its lots. */
export function makeAdjustOrder(deps: OrderDeps) {
  return async (actor: Actor, input: Ctx & { orderId: string; reason: string; lines: { lotId: string; delta: number }[] }): Promise<string> => {
    const scope = await resolveOrderScope(deps, actor, input);
    requireOrderSpecial(scope, "correct_orders");
    const order = await loadOrder(deps, scope, input.orderId);
    requireStatus(order, "fulfilled");
    const reason = normalizeName(input.reason);
    if (reason.length < 3 || reason.length > 300) throw new RuleViolation("REASON_TEXT_REQUIRED");
    if (input.lines.length === 0 || input.lines.some((l) => l.delta === 0)) throw new RuleViolation("INVALID_LINES");
    return deps.orders.adjust(order.id, reason, input.lines);
  };
}
