import type { Actor } from "@/core/domain/actor";
import { RuleViolation } from "@/core/domain/errors";
import type { StockOpsDeps } from "./operations-shared";
import { assertNameFree, validateItemName } from "./shared";
import { loadReasonForAdmin } from "./write-off-reasons-shared";

export function makeRenameWriteOffReason(deps: StockOpsDeps) {
  return async (actor: Actor, input: { id: string; name: string }): Promise<void> => {
    const reason = await loadReasonForAdmin(deps, actor, input.id);
    if (reason.standard) throw new RuleViolation("STANDARD_REASON_LOCKED");
    const name = validateItemName(input.name);
    assertNameFree(await deps.reasons.list(reason.companyId), name, reason.id);
    await deps.reasons.rename(reason.id, name);
  };
}
