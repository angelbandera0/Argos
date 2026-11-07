import type { Actor } from "@/core/domain/actor";
import { Forbidden } from "@/core/domain/errors";
import { canConfigureMinimum, loadLocation, scopeOfProduct, type StockDeps } from "./shared";

export function makeClearMinimum(deps: StockDeps) {
  return async (actor: Actor, input: { productId: string; locationId: string }): Promise<void> => {
    const scope = await scopeOfProduct(deps, actor, input.productId);
    const location = await loadLocation(deps, scope, input.locationId);
    if (!canConfigureMinimum(scope, location)) throw new Forbidden();
    await deps.stock.clearMinimum(input.productId, location.id);
  };
}
