import type { StockLine } from "@/core/application/ports/stock-repository";
import type { Actor } from "@/core/domain/actor";
import { Forbidden } from "@/core/domain/errors";
import type { StockStatus } from "@/core/domain/stock";
import { canSeeLocation, invalid, loadLocation, pageOf, resolveStockScope, type StockDeps } from "./shared";

export interface ListStockStatusInput {
  companyId?: string;
  locationId: string;
  status?: string;
  q?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
}

const STATUSES: readonly StockStatus[] = ["normal", "low", "out"];

export function makeListStockStatus(deps: StockDeps) {
  return async (
    actor: Actor,
    input: ListStockStatusInput,
  ): Promise<{ items: StockLine[]; total: number; counts: Record<StockStatus, number> }> => {
    const scope = await resolveStockScope(deps, actor, input);
    const location = await loadLocation(deps, scope, input.locationId);
    if (!canSeeLocation(scope, location)) throw new Forbidden();
    if (input.status !== undefined && !STATUSES.includes(input.status as StockStatus)) invalid();
    const filters = {
      companyId: scope.companyId,
      locationId: location.id,
      status: input.status as StockStatus | undefined,
      q: input.q?.trim() || undefined,
      categoryId: input.categoryId,
    };
    const [{ items, total }, counts] = await Promise.all([
      deps.stock.listStatus(filters, pageOf(input)),
      deps.stock.countByStatus(scope.companyId, location.id),
    ]);
    return { items, total, counts };
  };
}
