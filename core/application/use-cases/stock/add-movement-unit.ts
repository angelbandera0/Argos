import type { MovementUnitItem } from "@/core/application/ports/stock-repository";
import type { Actor } from "@/core/domain/actor";
import { assertNameFree, loadConfigForWrite, positiveAmount, validateItemName, type StockDeps } from "./shared";

export function makeAddMovementUnit(deps: StockDeps) {
  return async (actor: Actor, input: { productId: string; name: string; equivalence: number }): Promise<MovementUnitItem> => {
    const config = await loadConfigForWrite(deps, actor, input.productId);
    const name = validateItemName(input.name);
    const equivalence = positiveAmount(input.equivalence);
    assertNameFree(config.movementUnits, name);
    return deps.stock.addMovementUnit(input.productId, { name, equivalence });
  };
}
