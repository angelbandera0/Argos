import type { Actor } from "@/core/domain/actor";
import { RuleViolation } from "@/core/domain/errors";
import type { StockOpsDeps } from "./operations-shared";
import { loadReasonForAdmin } from "./write-off-reasons-shared";

export function makeDeleteWriteOffReason(deps: StockOpsDeps) {
  return async (actor: Actor, input: { id: string }): Promise<void> => {
    const reason = await loadReasonForAdmin(deps, actor, input.id);
    if (reason.standard) throw new RuleViolation("STANDARD_REASON_LOCKED");
    await deps.reasons.delete(reason.id);
  };
}
