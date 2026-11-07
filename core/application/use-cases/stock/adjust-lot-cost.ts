import type { Actor } from "@/core/domain/actor";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { hasSpecial } from "@/core/domain/permissions";
import { reasonText, type StockOpsDeps } from "./operations-shared";
import { scopeOfProduct } from "./shared";

export function makeAdjustLotCost(deps: StockOpsDeps) {
  return async (actor: Actor, input: { lotId: string; newUnitCost: number; reason: string }): Promise<string> => {
    const lot = await deps.stock.getLot(input.lotId);
    if (!lot) throw new NotFound();
    const scope = await scopeOfProduct(deps, actor, lot.productId);
    const access = scope.access;
    if (!scope.isAdmin && !(access && hasSpecial(access, "see_costs") && hasSpecial(access, "correct_orders"))) throw new Forbidden();
    const cost = input.newUnitCost;
    if (typeof cost !== "number" || !Number.isFinite(cost) || cost < 0 || Math.round(cost * 1e6) / 1e6 !== cost) throw new RuleViolation("INVALID_COST");
    const reason = reasonText(input.reason, true)!;
    return deps.ops.adjustLotCost({ lotId: lot.id, newUnitCost: cost, reason });
  };
}
