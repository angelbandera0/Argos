import type { Location } from "@/core/application/ports/stock-repository";
import type { Actor } from "@/core/domain/actor";
import { Forbidden } from "@/core/domain/errors";
import { canSeeLocation, resolveStockScope, type StockDeps } from "./shared";

export function makeListLocations(deps: StockDeps) {
  return async (actor: Actor, input: { companyId?: string } = {}): Promise<Location[]> => {
    const scope = await resolveStockScope(deps, actor, input);
    const all = await deps.stock.listLocations(scope.companyId);
    const visible = all.filter((l) => canSeeLocation(scope, l));
    if (!scope.isAdmin && visible.length === 0) throw new Forbidden();
    return visible;
  };
}
