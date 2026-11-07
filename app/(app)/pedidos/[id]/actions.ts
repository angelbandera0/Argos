"use server";

import { revalidatePath } from "next/cache";
import { purchaseErrorMessage, purchaseSchema } from "@/components/orders/purchase-logic";
import { adjustSchema, reviewErrorMessage, reviewSchema } from "@/components/orders/review-logic";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { requireOrderUser } from "../guard";

export interface PurchaseActionState {
  error?: string;
  ok?: "saved" | "submitted";
}

export async function purchaseAction(input: unknown, submit: boolean): Promise<PurchaseActionState> {
  const parsed = purchaseSchema.safeParse(input);
  if (!parsed.success) return { error: purchaseErrorMessage("INVALID_QUANTITY") };
  const { actor, orders, companyId } = await requireOrderUser();
  try {
    await orders.registerPurchase(actor, { companyId, orderId: parsed.data.orderId, lines: parsed.data.lines });
    if (submit) await orders.submitReview(actor, { companyId, orderId: parsed.data.orderId });
  } catch (e) {
    if (e instanceof Forbidden) return { error: "Solo el comprador asignado puede registrar la compra." };
    if (e instanceof NotFound) return { error: "El pedido ya no existe." };
    return { error: purchaseErrorMessage(e instanceof RuleViolation ? e.code : undefined) };
  }
  revalidatePath(`/pedidos/${parsed.data.orderId}`);
  revalidatePath("/pedidos");
  return { ok: submit ? "submitted" : "saved" };
}

export interface ReviewActionState {
  error?: string;
  ok?: "saved" | "confirmed" | "returned" | "adjusted";
}

function fail(e: unknown): ReviewActionState {
  if (e instanceof Forbidden) return { error: "No tienes permiso para esta acción." };
  if (e instanceof NotFound) return { error: "El pedido ya no existe." };
  return { error: reviewErrorMessage(e instanceof RuleViolation ? e.code : undefined) };
}

export async function reviewAction(input: unknown): Promise<ReviewActionState> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { error: reviewErrorMessage("INVALID_QUANTITY") };
  const d = parsed.data;
  const { actor, orders, companyId } = await requireOrderUser();
  try {
    if (d.kind === "save") await orders.saveReview(actor, { companyId, orderId: d.orderId, lines: d.lines.map((l) => ({ lineId: l.lineId, qtyReceived: l.qtyReceived })) });
    else if (d.kind === "confirm") await orders.confirmOrder(actor, { companyId, orderId: d.orderId, lines: d.lines });
    else await orders.returnOrder(actor, { companyId, orderId: d.orderId, note: d.note });
  } catch (e) {
    return fail(e);
  }
  revalidatePath(`/pedidos/${d.orderId}`);
  revalidatePath("/pedidos");
  return { ok: d.kind === "save" ? "saved" : d.kind === "confirm" ? "confirmed" : "returned" };
}

export async function adjustAction(input: unknown): Promise<ReviewActionState> {
  const parsed = adjustSchema.safeParse(input);
  if (!parsed.success) return { error: reviewErrorMessage("REASON_TEXT_REQUIRED") };
  const { actor, orders, companyId } = await requireOrderUser();
  try {
    await orders.adjustOrder(actor, { companyId, orderId: parsed.data.orderId, reason: parsed.data.reason, lines: [{ lotId: parsed.data.lotId, delta: parsed.data.delta }] });
  } catch (e) {
    return fail(e);
  }
  revalidatePath(`/pedidos/${parsed.data.orderId}`);
  return { ok: "adjusted" };
}
