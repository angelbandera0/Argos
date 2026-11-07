import type { Actor } from "@/core/domain/actor";
import { assertNameFree, findItem, loadConfigForWrite, positiveAmount, validateItemName, type StockDeps } from "./shared";

export function makeUpdateMovementUnit(deps: StockDeps) {
  return async (actor: Actor, input: { productId: string; id: string; name?: string; equivalence?: number }): Promise<void> => {
    const config = await loadConfigForWrite(deps, actor, input.productId);
    findItem(config.movementUnits, input.id);
    const changes: { name?: string; equivalence?: number } = {};
    if (input.name !== undefined) {
      changes.name = validateItemName(input.name);
      assertNameFree(config.movementUnits, changes.name, input.id);
    }
    if (input.equivalence !== undefined) changes.equivalence = positiveAmount(input.equivalence);
    await deps.stock.updateMovementUnit(input.productId, input.id, changes);
  };
}
