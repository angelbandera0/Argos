import type { Actor } from "@/core/domain/actor";
import { activateStore } from "./activate-store";
import type { SessionDeps } from "./assert-session-active";

export function makeSwitchStore(deps: SessionDeps) {
  return async (actor: Actor, input: { storeId: string }): Promise<void> =>
    activateStore(deps, actor, input.storeId, { requireActiveStore: true });
}
