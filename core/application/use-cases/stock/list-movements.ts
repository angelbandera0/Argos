import type { MovementView } from "@/core/application/ports/stock-repository";
import type { Actor } from "@/core/domain/actor";
import { Forbidden } from "@/core/domain/errors";
import { canSeeCosts, canSeeLocation, invalid, loadLocation, pageOf, resolveStockScope, requireView, stripCosts, type StockDeps } from "./shared";

export interface ListMovementsInput {
  companyId?: string;
  productId?: string;
  locationId?: string;
  type?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

function date(v: string | undefined, endOfDay: boolean): Date | undefined {
  if (v === undefined) return undefined;
  const d = new Date(endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T23:59:59.999Z` : v);
  return Number.isNaN(d.getTime()) ? invalid() : d;
}

export function makeListMovements(deps: StockDeps) {
  return async (actor: Actor, input: ListMovementsInput = {}): Promise<{ items: MovementView[]; total: number }> => {
    const scope = await resolveStockScope(deps, actor, input);
    requireView(scope);
    const visible = (await deps.stock.listLocations(scope.companyId)).filter((l) => canSeeLocation(scope, l));
    if (input.locationId !== undefined) {
      const location = await loadLocation(deps, scope, input.locationId);
      if (!canSeeLocation(scope, location)) throw new Forbidden();
    }
    const { items, total } = await deps.stock.listMovements(
      {
        companyId: scope.companyId,
        locationIds: visible.map((l) => l.id),
        productId: input.productId,
        locationId: input.locationId,
        type: input.type,
        from: date(input.from, false),
        to: date(input.to, true),
      },
      pageOf(input),
    );
    return { items: stripCosts(items, canSeeCosts(actor, scope.access)), total };
  };
}
