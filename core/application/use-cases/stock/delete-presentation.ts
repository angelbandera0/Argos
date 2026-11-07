import type { Actor } from "@/core/domain/actor";
import { findItem, loadConfigForWrite, type StockDeps } from "./shared";

export function makeDeletePresentation(deps: StockDeps) {
  return async (actor: Actor, input: { productId: string; id: string }): Promise<void> => {
    const config = await loadConfigForWrite(deps, actor, input.productId);
    findItem(config.presentations, input.id);
    await deps.stock.deletePresentation(input.productId, input.id);
  };
}
