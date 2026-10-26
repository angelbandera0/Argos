import type { HistoryEntry, HistoryFilter, HistoryPage } from "@/core/application/ports/history-reader";
import { requireOperatorStore } from "@/core/application/use-cases/access/assert-session-active";
import type { Actor } from "@/core/domain/actor";
import { Forbidden } from "@/core/domain/errors";
import type { Module } from "@/core/domain/permissions";
import { sanitizeEntry } from "./sanitize";
import { resolveAdminScope, type HistoryDeps } from "./shared";

export interface ListHistoryInput extends HistoryFilter {
  cursor?: string;
  limit?: number;
}

export function makeListHistory(deps: HistoryDeps) {
  return async (actor: Actor, input: ListHistoryInput = {}): Promise<HistoryPage<HistoryEntry>> => {
    let companyId: string | undefined;
    if (actor.kind === "operator") {
      const { store } = await requireOperatorStore(deps, actor);
      const requested = [...(input.module ? [input.module] : []), ...(input.modules ?? [])];
      if (!requested.length || requested.some((m) => !store.permissions[m as Module]?.view)) throw new Forbidden();
      companyId = store.companyId;
    } else {
      companyId = await resolveAdminScope(deps, actor, input.companyId);
    }
    const page = await deps.history.list({ ...input, companyId });
    return { ...page, items: page.items.map(sanitizeEntry) };
  };
}
