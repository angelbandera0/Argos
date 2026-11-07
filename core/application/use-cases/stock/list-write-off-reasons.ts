import type { Actor } from "@/core/domain/actor";
import { Forbidden } from "@/core/domain/errors";
import { hasSpecial } from "@/core/domain/permissions";
import type { StockOpsDeps } from "./operations-shared";
import { resolveStockScope } from "./shared";

export function makeListWriteOffReasons(deps: StockOpsDeps) {
  return async (actor: Actor, input: { companyId?: string }) => {
    const scope = await resolveStockScope(deps, actor, input);
    const all = await deps.reasons.list(scope.companyId);
    if (scope.isAdmin) return all;
    if (!scope.access || !hasSpecial(scope.access, "write_off")) throw new Forbidden();
    return all.filter((r) => r.active);
  };
}
