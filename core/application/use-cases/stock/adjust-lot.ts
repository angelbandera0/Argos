import type { Actor } from "@/core/domain/actor";
import { NotFound, RuleViolation } from "@/core/domain/errors";
import { qty, toNumber } from "@/core/domain/stock";
import { reasonText, requireDo, type StockOpsDeps } from "./operations-shared";
import { loadLocation, scopeOfProduct } from "./shared";

export function makeAdjustLot(deps: StockOpsDeps) {
  return async (actor: Actor, input: { lotId: string; delta: number; reasonText: string }): Promise<string> => {
    const lot = await deps.stock.getLot(input.lotId);
    if (!lot) throw new NotFound();
    const scope = await scopeOfProduct(deps, actor, lot.productId);
    const location = await loadLocation(deps, scope, lot.locationId);
    requireDo(scope, "adjust_stock", location);
    const delta = qty(input.delta, true);
    if (delta === 0) throw new RuleViolation("INVALID_QUANTITY");
    const text = reasonText(input.reasonText, true)!;
    return deps.ops.adjust({ lotId: lot.id, delta: toNumber(delta), reasonText: text });
  };
}
