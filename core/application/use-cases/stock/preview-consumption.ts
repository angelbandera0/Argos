import type { Pick } from "@/core/application/ports/stock-operations";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, RuleViolation, type RuleCode } from "@/core/domain/errors";
import { toNumber } from "@/core/domain/stock";
import { allocate, packsAvailable, resolveConsumption, type StockOpsDeps } from "./operations-shared";
import { canSeeCosts, canSeeLocation, loadLocation, scopeOfProduct, stripCosts } from "./shared";

export function makePreviewConsumption(deps: StockOpsDeps) {
  return async (actor: Actor, input: { productId: string; locationId: string; qty: number; unit: string; picks?: Pick[] }) => {
    const scope = await scopeOfProduct(deps, actor, input.productId);
    const location = await loadLocation(deps, scope, input.locationId);
    if (!canSeeLocation(scope, location)) throw new Forbidden();
    const ctx = await resolveConsumption(deps, input, location);
    const lots = stripCosts(ctx.views, canSeeCosts(actor, scope.access));
    const pack = ctx.pack && { name: ctx.pack.name, available: packsAvailable(ctx.views, ctx.pack), perLot: ctx.views.map((v) => ({ lotId: v.id, packs: packsAvailable([v], ctx.pack!) })) };
    const base = { baseQty: ctx.baseQty === null ? 0 : toNumber(ctx.baseQty), lots, pack };
    try {
      return { ...base, ...allocate(ctx.views, ctx, input.picks), errors: undefined as RuleCode[] | undefined };
    } catch (e) {
      if (!(e instanceof RuleViolation)) throw e;
      return { ...base, allocation: [], suggested: [], suggestedPacks: undefined, allocationPacks: undefined, isDeviation: false, errors: [e.code] as RuleCode[] | undefined };
    }
  };
}
