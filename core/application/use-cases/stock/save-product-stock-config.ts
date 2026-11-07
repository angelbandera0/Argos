import type { Actor } from "@/core/domain/actor";
import { Forbidden } from "@/core/domain/errors";
import { unitsOf, type Unit } from "@/core/domain/stock";
import { canConfigureUnits, invalid, scopeOfProduct, type StockDeps } from "./shared";

const UNITS: string[] = (["weight", "volume", "count"] as const).flatMap(unitsOf);

export function makeSaveProductStockConfig(deps: StockDeps) {
  return async (actor: Actor, input: { productId: string; storable: boolean; baseUnit: string }): Promise<void> => {
    const scope = await scopeOfProduct(deps, actor, input.productId);
    if (!canConfigureUnits(scope)) throw new Forbidden();
    if (typeof input.storable !== "boolean" || !UNITS.includes(input.baseUnit)) invalid();
    await deps.stock.saveProductConfig(input.productId, { storable: input.storable, baseUnit: input.baseUnit as Unit });
  };
}
