import type { RequestFilters } from "@/core/application/ports/request-repository";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, NotFound } from "@/core/domain/errors";
import { pageOf } from "@/core/application/use-cases/stock/shared";
import { canSeeStore, isHandler, requireHandler, resolveRequestScope, type RequestDeps } from "./shared";

export function makeListRequests(deps: RequestDeps) {
  return async (actor: Actor, input: { companyId?: string; page?: number; pageSize?: number } & RequestFilters) => {
    const scope = await resolveRequestScope(deps, actor, input);
    const filters = { status: input.status, storeId: input.storeId };
    if (!isHandler(scope)) {
      if (!scope.access?.permissions.requests?.view) throw new Forbidden();
      filters.storeId = scope.access.storeId;
    }
    return deps.requests.list(scope.companyId, filters, pageOf(input));
  };
}

export function makeGetRequest(deps: RequestDeps) {
  return async (actor: Actor, input: { companyId?: string; requestId: string }) => {
    const scope = await resolveRequestScope(deps, actor, input);
    const request = await deps.requests.get(input.requestId);
    if (!request || request.companyId !== scope.companyId || !canSeeStore(scope, request.storeId)) throw new NotFound();
    return request;
  };
}

export function makeListPurchaseBag(deps: RequestDeps) {
  return async (actor: Actor, input: { companyId?: string }) => {
    const scope = await resolveRequestScope(deps, actor, input);
    requireHandler(scope);
    return deps.requests.listPurchaseBag(scope.companyId);
  };
}
