import type { Actor } from "@/core/domain/actor";
import type { LotCostAdjustment } from "@/core/application/ports/stock-repository";
import { Forbidden, NotFound } from "@/core/domain/errors";
import type { StockDeps } from "./shared";
import { canSeeCosts, scopeOfProduct } from "./shared";

export function makeListLotCostAdjustments(deps: StockDeps) {
  return async (actor: Actor, input: { lotId: string }): Promise<LotCostAdjustment[]> => {
    const lot = await deps.stock.getLot(input.lotId);
    if (!lot) throw new NotFound();
    const scope = await scopeOfProduct(deps, actor, lot.productId);
    if (!canSeeCosts(actor, scope.access)) throw new Forbidden();
    return deps.stock.listLotCostAdjustments(lot.id);
  };
}
