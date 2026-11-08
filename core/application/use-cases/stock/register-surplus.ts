import type { Actor } from "@/core/domain/actor";
import { RuleViolation } from "@/core/domain/errors";
import { toNumber } from "@/core/domain/stock";
import { costOf, positiveQty, reasonText, requireDo, type StockOpsDeps } from "./operations-shared";
import { loadLocation, scopeOfProduct } from "./shared";

export function makeRegisterSurplus(deps: StockOpsDeps) {
  return async (
    actor: Actor,
    input: { productId: string; locationId: string; qty: number; unit?: string; content?: number; reasonText: string; unitCost?: number; currencyId?: string },
  ): Promise<string> => {
    const scope = await scopeOfProduct(deps, actor, input.productId);
    const location = await loadLocation(deps, scope, input.locationId);
    requireDo(scope, "adjust_stock", location);
    const config = await deps.stock.getProductConfig(input.productId);
    if (!config?.storable) throw new RuleViolation("PRODUCT_NOT_STORABLE");
    const amount = positiveQty(input.qty);
    const text = reasonText(input.reasonText, true)!;
    const unitCost = costOf(actor, scope, input);
    return deps.ops.registerSurplus({ productId: input.productId, locationId: location.id, qty: toNumber(amount), unit: input.unit, content: input.content ?? null, reasonText: text, unitCost, currencyId: input.currencyId ?? null });
  };
}
