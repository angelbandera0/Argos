import type { HistoryEntry, HistoryPage } from "@/core/application/ports/history-reader";
import { requireOperatorStore } from "@/core/application/use-cases/access/assert-session-active";
import type { Actor } from "@/core/domain/actor";
import { Forbidden } from "@/core/domain/errors";
import type { Module } from "@/core/domain/permissions";
import { sanitizeEntry } from "./sanitize";
import { resolveAdminScope, type HistoryDeps } from "./shared";

export interface ListHistoryInput {
  companyId?: string;
  module?: string;
  actorId?: string;
  from?: Date;
  to?: Date;
  cursor?: string;
  limit?: number;
}

export function makeListHistory(deps: HistoryDeps) {
  return async (actor: Actor, input: ListHistoryInput = {}): Promise<HistoryPage<HistoryEntry>> => {
    let companyId: string | undefined;
    if (actor.kind === "operator") {
      const { store } = await requireOperatorStore(deps, actor);
      if (!input.module || !store.permissions[input.module as Module]?.view) throw new Forbidden();
      companyId = store.companyId;
    } else {
      companyId = await resolveAdminScope(deps, actor, input.companyId);
    }
    const page = await deps.history.list({ ...input, companyId });
    return { ...page, items: page.items.map(sanitizeEntry) };
  };
}
