import type { AuthEventEntry, HistoryPage } from "@/core/application/ports/history-reader";
import type { Actor } from "@/core/domain/actor";
import { resolveAdminScope, type HistoryDeps } from "./shared";

export function makeListAuthEvents(deps: HistoryDeps) {
  return async (
    actor: Actor,
    input: { companyId?: string; cursor?: string; limit?: number } = {},
  ): Promise<HistoryPage<AuthEventEntry>> => {
    const companyId = await resolveAdminScope(deps, actor, input.companyId);
    return deps.history.listAuthEvents({ ...input, companyId });
  };
}
