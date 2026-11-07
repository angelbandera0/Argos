import type { Actor } from "@/core/domain/actor";
import { RuleViolation } from "@/core/domain/errors";
import type { StockOpsDeps } from "./operations-shared";
import { loadReasonForAdmin } from "./write-off-reasons-shared";

export function makeSetWriteOffReasonActive(deps: StockOpsDeps) {
  return async (actor: Actor, input: { id: string; active: boolean }): Promise<void> => {
    const reason = await loadReasonForAdmin(deps, actor, input.id);
    if (!input.active && reason.requiresText) throw new RuleViolation("STANDARD_REASON_LOCKED");
    await deps.reasons.setActive(reason.id, input.active);
  };
}
