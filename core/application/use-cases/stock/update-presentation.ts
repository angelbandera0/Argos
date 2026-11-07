import type { Actor } from "@/core/domain/actor";
import { assertNameFree, findItem, loadConfigForWrite, positiveAmount, validateItemName, type StockDeps } from "./shared";

export function makeUpdatePresentation(deps: StockDeps) {
  return async (actor: Actor, input: { productId: string; id: string; name?: string; content?: number }): Promise<void> => {
    const config = await loadConfigForWrite(deps, actor, input.productId);
    findItem(config.presentations, input.id);
    const changes: { name?: string; content?: number } = {};
    if (input.name !== undefined) {
      changes.name = validateItemName(input.name);
      assertNameFree(config.presentations, changes.name, input.id);
    }
    if (input.content !== undefined) changes.content = positiveAmount(input.content);
    await deps.stock.updatePresentation(input.productId, input.id, changes);
  };
}
