import type { PresentationItem } from "@/core/application/ports/stock-repository";
import type { Actor } from "@/core/domain/actor";
import { assertNameFree, loadConfigForWrite, positiveAmount, validateItemName, type StockDeps } from "./shared";

export function makeAddPresentation(deps: StockDeps) {
  return async (actor: Actor, input: { productId: string; name: string; content: number }): Promise<PresentationItem> => {
    const config = await loadConfigForWrite(deps, actor, input.productId);
    const name = validateItemName(input.name);
    const content = positiveAmount(input.content);
    assertNameFree(config.presentations, name);
    return deps.stock.addPresentation(input.productId, { name, content });
  };
}
