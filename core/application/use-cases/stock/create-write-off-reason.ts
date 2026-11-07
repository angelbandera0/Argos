import type { Actor } from "@/core/domain/actor";
import { Forbidden, RuleViolation } from "@/core/domain/errors";
import type { StockOpsDeps } from "./operations-shared";
import { assertNameFree, resolveStockScope, validateItemName } from "./shared";

export function makeCreateWriteOffReason(deps: StockOpsDeps) {
  return async (actor: Actor, input: { companyId: string; code: string; name: string }) => {
    const scope = await resolveStockScope(deps, actor, input);
    if (!scope.isAdmin) throw new Forbidden();
    const code = input.code.trim().toLowerCase();
    if (!/^[a-z][a-z0-9_]{0,39}$/.test(code)) throw new RuleViolation("INVALID_INPUT");
    const name = validateItemName(input.name);
    const existing = await deps.reasons.list(scope.companyId);
    if (existing.some((r) => r.code === code)) throw new RuleViolation("CODE_TAKEN");
    assertNameFree(existing, name);
    return deps.reasons.create(scope.companyId, { code, name });
  };
}
