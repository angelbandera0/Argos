import type { Actor } from "@/core/domain/actor";
import { Forbidden } from "@/core/domain/errors";
import { qty, toNumber } from "@/core/domain/stock";
import { canConfigureMinimum, loadLocation, scopeOfProduct, type StockDeps } from "./shared";

export function makeSetMinimum(deps: StockDeps) {
  return async (actor: Actor, input: { productId: string; locationId: string; minimum: number }): Promise<void> => {
    const scope = await scopeOfProduct(deps, actor, input.productId);
    const location = await loadLocation(deps, scope, input.locationId);
    if (!canConfigureMinimum(scope, location)) throw new Forbidden();
    await deps.stock.setMinimum(input.productId, location.id, toNumber(qty(input.minimum)));
  };
}
