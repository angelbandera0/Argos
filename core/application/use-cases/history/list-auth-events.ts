import type { AuthEventEntry, AuthEventFilter, HistoryPage } from "@/core/application/ports/history-reader";
import type { Actor } from "@/core/domain/actor";
import { resolveAdminScope, type HistoryDeps } from "./shared";

export function makeListAuthEvents(deps: HistoryDeps) {
  return async (
    actor: Actor,
    input: AuthEventFilter & { cursor?: string; limit?: number } = {},
  ): Promise<HistoryPage<AuthEventEntry>> => {
    const companyId = await resolveAdminScope(deps, actor, input.companyId);
    return deps.history.listAuthEvents({ ...input, companyId });
  };
}
