import type { LotView } from "@/core/application/ports/stock-repository";
import type { Actor } from "@/core/domain/actor";
import { Forbidden } from "@/core/domain/errors";
import { canSeeCosts, canSeeLocation, loadLocation, resolveStockScope, stripCosts, type StockDeps } from "./shared";

export function makeListLocationLots(deps: StockDeps) {
  return async (actor: Actor, input: { companyId?: string; locationId: string }): Promise<LotView[]> => {
    const scope = await resolveStockScope(deps, actor, input);
    const location = await loadLocation(deps, scope, input.locationId);
    if (!canSeeLocation(scope, location)) throw new Forbidden();
    return stripCosts(await deps.stock.listLocationLots(location.id), canSeeCosts(actor, scope.access));
  };
}
