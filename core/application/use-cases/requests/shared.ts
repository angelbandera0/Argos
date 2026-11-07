import type { Clock } from "@/core/application/ports/clock";
import type { CompanyRepository } from "@/core/application/ports/company-repository";
import type { RequestRepository } from "@/core/application/ports/request-repository";
import type { SessionRepository } from "@/core/application/ports/session-repository";
import type { StoreAccessReader } from "@/core/application/ports/store-access-reader";
import { resolveStockScope, type StockScope } from "@/core/application/use-cases/stock/shared";
import type { Actor } from "@/core/domain/actor";
import { Forbidden } from "@/core/domain/errors";
import { hasSpecial } from "@/core/domain/permissions";

export interface RequestDeps {
  requests: RequestRepository;
  companies: CompanyRepository;
  sessions: SessionRepository;
  access: StoreAccessReader;
  clock: Clock;
}

export const resolveRequestScope = (deps: RequestDeps, actor: Actor, input: { companyId?: string }): Promise<StockScope> =>
  resolveStockScope(deps, actor, input);

export const isHandler = (scope: StockScope): boolean =>
  scope.isAdmin || (scope.access !== null && hasSpecial(scope.access, "handle_requests", { warehouse: true }));

export const requireHandler = (scope: StockScope) => {
  if (!isHandler(scope)) throw new Forbidden();
};

/** Handlers see every store; the rest need requests view and only their own store. */
export function canSeeStore(scope: StockScope, storeId: string): boolean {
  if (isHandler(scope)) return true;
  return !!scope.access?.permissions.requests?.view && scope.access.storeId === storeId;
}
