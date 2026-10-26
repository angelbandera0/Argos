import type { AuthEventFilter, HistoryFilter } from "@/core/application/ports/history-reader";
import { requireOperatorStore } from "@/core/application/use-cases/access/assert-session-active";
import type { Actor } from "@/core/domain/actor";
import type { Module } from "@/core/domain/permissions";
import { resolveAdminScope, type HistoryDeps } from "./shared";

export type CountHistoryInput = Omit<HistoryFilter, "module" | "modules"> & { modules: string[] };

/** Per-module counts for the tabs; an operator only gets the modules where the role has «Ver». */
export function makeCountHistory(deps: HistoryDeps) {
  return async (actor: Actor, input: CountHistoryInput): Promise<Record<string, number>> => {
    if (actor.kind === "operator") {
      const { store } = await requireOperatorStore(deps, actor);
      const modules = input.modules.filter((m) => store.permissions[m as Module]?.view);
      if (!modules.length) return {};
      return deps.history.countByModule({ ...input, modules, companyId: store.companyId });
    }
    const companyId = await resolveAdminScope(deps, actor, input.companyId);
    return deps.history.countByModule({ ...input, companyId });
  };
}

export function makeCountAuthEvents(deps: HistoryDeps) {
  return async (actor: Actor, input: AuthEventFilter = {}): Promise<number> => {
    const companyId = await resolveAdminScope(deps, actor, input.companyId);
    return deps.history.countAuthEvents({ ...input, companyId });
  };
}
