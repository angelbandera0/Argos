import type { LotView, ProductStockConfig, StockLine } from "@/core/application/ports/stock-repository";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, NotFound } from "@/core/domain/errors";
import { canSeeCosts, canSeeLocation, loadLocation, scopeOfProduct, stripCosts, type StockDeps } from "./shared";

export interface ProductStock {
  config: ProductStockConfig;
  lots: LotView[];
  quantity: number;
  minimum: number | null;
  status: StockLine["status"];
}

export function makeGetProductStock(deps: StockDeps) {
  return async (actor: Actor, input: { productId: string; locationId: string; onlyAvailable?: boolean }): Promise<ProductStock> => {
    const scope = await scopeOfProduct(deps, actor, input.productId);
    const location = await loadLocation(deps, scope, input.locationId);
    if (!canSeeLocation(scope, location)) throw new Forbidden();
    const config = await deps.stock.getProductConfig(input.productId);
    if (!config) throw new NotFound();
    const [line, lots] = await Promise.all([
      deps.stock.getStockLine(input.productId, location.id),
      deps.stock.listLots(input.productId, location.id, { onlyAvailable: input.onlyAvailable ?? true }),
    ]);
    return {
      config,
      lots: stripCosts(lots, canSeeCosts(actor, scope.access)),
      quantity: line?.quantity ?? 0,
      minimum: line?.minimum ?? null,
      status: line?.status ?? "out",
    };
  };
}
