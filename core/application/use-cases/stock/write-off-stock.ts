import type { Pick, WriteOffResult } from "@/core/application/ports/stock-operations";
import type { Actor } from "@/core/domain/actor";
import { RuleViolation } from "@/core/domain/errors";
import { planConsumption, reasonText, requireDo, type StockOpsDeps } from "./operations-shared";
import { loadLocation, scopeOfProduct } from "./shared";

export function makeWriteOffStock(deps: StockOpsDeps) {
  return async (
    actor: Actor,
    input: { productId: string; locationId: string; qty: number; unit: string; reasonId: string; reasonText?: string; picks?: Pick[]; deviationReason?: string },
  ): Promise<WriteOffResult> => {
    const scope = await scopeOfProduct(deps, actor, input.productId);
    const location = await loadLocation(deps, scope, input.locationId);
    requireDo(scope, "write_off", location);
    const reason = await deps.reasons.get(input.reasonId);
    if (!reason || reason.companyId !== scope.companyId || !reason.active) throw new RuleViolation("INVALID_REASON");
    const text = reasonText(input.reasonText, reason.requiresText, 1);
    const plan = await planConsumption(deps, scope, location, input);
    return deps.ops.writeOff({
      productId: input.productId,
      locationId: location.id,
      qty: input.qty,
      unit: input.unit,
      reasonId: reason.id,
      reasonText: text,
      picks: plan.opsPicks,
      deviationReason: input.deviationReason,
    });
  };
}
