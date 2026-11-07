import type { OrderDetail, OrderFilters } from "@/core/application/ports/order-repository";
import { pageOf, canSeeCosts } from "@/core/application/use-cases/stock/shared";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, NotFound } from "@/core/domain/errors";
import { hasOrderSpecial, loadOrder, resolveOrderScope, type OrderDeps } from "./shared";

export function makeListOrders(deps: OrderDeps) {
  return async (actor: Actor, input: { companyId?: string; page?: number; pageSize?: number } & OrderFilters) => {
    const scope = await resolveOrderScope(deps, actor, input);
    const manager = hasOrderSpecial(scope, "build_orders") || hasOrderSpecial(scope, "review_orders");
    if (!manager && !scope.access?.specialPermissions.some((g) => g.permission === "make_purchases")) throw new Forbidden();
    const filters = { status: input.status, buyerId: manager ? input.buyerId : actor.userId, createdFrom: input.createdFrom, createdTo: input.createdTo };
    return deps.orders.list(scope.companyId, filters, pageOf(input));
  };
}

export function makeListOrderEvents(deps: OrderDeps) {
  return async (actor: Actor, input: { companyId?: string; orderId: string }) => {
    const scope = await resolveOrderScope(deps, actor, input);
    await loadOrder(deps, scope, input.orderId);
    return deps.orders.listEvents(input.orderId);
  };
}

/** Costs are visible only with see_costs (or admin) and, for the order's own buyer, the purchase costs without the shortage value; null stays "no known cost". */
export function makeGetOrder(deps: OrderDeps) {
  return async (actor: Actor, input: { companyId?: string; orderId: string }): Promise<OrderDetail> => {
    const scope = await resolveOrderScope(deps, actor, input);
    const order = await loadOrder(deps, scope, input.orderId);
    const isBuyer = order.buyerId === actor.userId;
    if (!isBuyer && !hasOrderSpecial(scope, "build_orders") && !hasOrderSpecial(scope, "review_orders")) throw new NotFound();
    if (canSeeCosts(actor, scope.access)) return order;
    if (isBuyer) return { ...order, shortageValue: undefined, lines: order.lines.map(({ shortageValue: _v, ...line }) => line) };
    const { amountGiven: _g, spent: _s, leftover: _l, shortageValue: _sv, ...rest } = order;
    return { ...rest, lines: order.lines.map(({ unitCost: _c, shortageValue: _v, ...line }) => line) };
  };
}
