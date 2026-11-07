import type { ProductStockConfig } from "@/core/application/ports/stock-repository";
import type { Actor } from "@/core/domain/actor";
import { NotFound } from "@/core/domain/errors";
import { requireView, scopeOfProduct, type StockDeps } from "./shared";

export function makeGetProductStockConfig(deps: StockDeps) {
  return async (actor: Actor, input: { productId: string }): Promise<ProductStockConfig> => {
    requireView(await scopeOfProduct(deps, actor, input.productId));
    const config = await deps.stock.getProductConfig(input.productId);
    if (!config) throw new NotFound();
    return config;
  };
}
