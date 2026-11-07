import type { Actor } from "@/core/domain/actor";
import { findItem, loadConfigForWrite, type StockDeps } from "./shared";

export function makeSetMovementUnitActive(deps: StockDeps) {
  return async (actor: Actor, input: { productId: string; id: string; active: boolean }): Promise<void> => {
    const config = await loadConfigForWrite(deps, actor, input.productId);
    findItem(config.movementUnits, input.id);
    await deps.stock.setMovementUnitActive(input.productId, input.id, input.active);
  };
}
