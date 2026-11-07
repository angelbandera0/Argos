import type { Clock } from "@/core/application/ports/clock";
import type { CompanyRepository } from "@/core/application/ports/company-repository";
import type { OrderDetail, OrderRepository } from "@/core/application/ports/order-repository";
import type { SessionRepository } from "@/core/application/ports/session-repository";
import type { StoreAccessReader } from "@/core/application/ports/store-access-reader";
import { resolveStockScope, type StockScope } from "@/core/application/use-cases/stock/shared";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { hasSpecial, type SpecialPermission } from "@/core/domain/permissions";
import type { OrderStatus } from "@/core/domain/orders";

export interface OrderDeps {
  orders: OrderRepository;
  companies: CompanyRepository;
  sessions: SessionRepository;
  access: StoreAccessReader;
  clock: Clock;
}

export const resolveOrderScope = (deps: OrderDeps, actor: Actor, input: { companyId?: string }): Promise<StockScope> =>
  resolveStockScope(deps, actor, input);

export const hasOrderSpecial = (scope: StockScope, permission: SpecialPermission): boolean =>
  scope.isAdmin || (scope.access !== null && hasSpecial(scope.access, permission));

export const requireOrderSpecial = (scope: StockScope, permission: SpecialPermission) => {
  if (!hasOrderSpecial(scope, permission)) throw new Forbidden();
};

export async function loadOrder(deps: OrderDeps, scope: StockScope, orderId: string): Promise<OrderDetail> {
  const order = await deps.orders.get(orderId);
  if (!order || order.companyId !== scope.companyId) throw new NotFound();
  return order;
}

export function requireStatus(order: OrderDetail, ...allowed: OrderStatus[]) {
  if (!allowed.includes(order.status)) throw new RuleViolation("INVALID_STATUS");
}

/** The buyer or an admin acts on the purchase. */
export function requireBuyer(scope: StockScope, actor: Actor, order: OrderDetail) {
  if (!scope.isAdmin && order.buyerId !== actor.userId) throw new Forbidden();
}

/** Review needs review_orders (or admin) and never the order's own buyer. */
export function requireReviewer(scope: StockScope, actor: Actor, order: OrderDetail) {
  requireOrderSpecial(scope, "review_orders");
  if (order.buyerId === actor.userId) throw new RuleViolation("BUYER_CANNOT_REVIEW");
}
