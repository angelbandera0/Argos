import type { Pick } from "@/core/application/ports/stock-operations";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, RuleViolation, type RuleCode } from "@/core/domain/errors";
import { toNumber } from "@/core/domain/stock";
import { allocate, resolveConsumption, type StockOpsDeps } from "./operations-shared";
import { canSeeCosts, canSeeLocation, loadLocation, scopeOfProduct, stripCosts } from "./shared";

export function makePreviewConsumption(deps: StockOpsDeps) {
  return async (actor: Actor, input: { productId: string; locationId: string; qty: number; unit: string; picks?: Pick[] }) => {
    const scope = await scopeOfProduct(deps, actor, input.productId);
    const location = await loadLocation(deps, scope, input.locationId);
    if (!canSeeLocation(scope, location)) throw new Forbidden();
    const { baseQty, views } = await resolveConsumption(deps, input, location);
    const lots = stripCosts(views, canSeeCosts(actor, scope.access));
    const base = { baseQty: toNumber(baseQty), lots };
    try {
      return { ...base, ...allocate(views, baseQty, input.picks), errors: undefined as RuleCode[] | undefined };
    } catch (e) {
      if (!(e instanceof RuleViolation)) throw e;
      return { ...base, allocation: [], suggested: [], isDeviation: false, errors: [e.code] as RuleCode[] | undefined };
    }
  };
}
