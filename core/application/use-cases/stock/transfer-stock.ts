import type { Pick, TransferResult } from "@/core/application/ports/stock-operations";
import type { Actor } from "@/core/domain/actor";
import { RuleViolation } from "@/core/domain/errors";
import { toNumber } from "@/core/domain/stock";
import { planConsumption, requireDo, type StockOpsDeps } from "./operations-shared";
import { loadLocation, scopeOfProduct } from "./shared";

export function makeTransferStock(deps: StockOpsDeps) {
  return async (
    actor: Actor,
    input: { productId: string; fromLocationId: string; toLocationId: string; qty: number; unit: string; picks?: Pick[]; deviationReason?: string },
  ): Promise<TransferResult> => {
    const scope = await scopeOfProduct(deps, actor, input.productId);
    const from = await loadLocation(deps, scope, input.fromLocationId);
    const to = await loadLocation(deps, scope, input.toLocationId);
    requireDo(scope, "transfer", from);
    if (from.kind !== "warehouse") throw new RuleViolation("NOT_WAREHOUSE");
    if (to.kind !== "store") throw new RuleViolation("NOT_STORE");
    await planConsumption(deps, scope, from, input);
    return deps.ops.transfer({
      productId: input.productId,
      fromLocationId: from.id,
      toLocationId: to.id,
      qty: input.qty,
      unit: input.unit,
      picks: input.picks,
      deviationReason: input.deviationReason,
    });
  };
}
