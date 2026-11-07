import type { Actor } from "@/core/domain/actor";
import { Forbidden, RuleViolation } from "@/core/domain/errors";
import { hasSpecial } from "@/core/domain/permissions";
import { qty } from "@/core/domain/stock";
import { normalizeName } from "@/core/domain/name";
import { resolveRequestScope, type RequestDeps } from "./shared";

export function makeCreateRequest(deps: RequestDeps) {
  return async (
    actor: Actor,
    input: { companyId?: string; storeId: string; note?: string; lines: { productId: string; qty: number; unit: string }[] },
  ): Promise<string> => {
    const scope = await resolveRequestScope(deps, actor, input);
    if (!scope.isAdmin && !(scope.access && scope.access.storeId === input.storeId && hasSpecial(scope.access, "request_replenishment"))) {
      throw new Forbidden();
    }
    if (input.lines.length === 0) throw new RuleViolation("EMPTY_REQUEST");
    if (new Set(input.lines.map((l) => l.productId)).size !== input.lines.length) throw new RuleViolation("DUPLICATE_PRODUCT");
    const lines = input.lines.map((l) => {
      const unit = normalizeName(l.unit);
      if (qty(l.qty) <= 0) throw new RuleViolation("INVALID_QUANTITY");
      if (!unit) throw new RuleViolation("INVALID_UNIT");
      return { productId: l.productId, qty: l.qty, unit };
    });
    const note = input.note === undefined ? "" : normalizeName(input.note);
    return deps.requests.create({ storeId: input.storeId, note: note || undefined, lines });
  };
}
