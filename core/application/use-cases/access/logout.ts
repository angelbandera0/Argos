import type { SessionRepository } from "@/core/application/ports/session-repository";
import type { Actor } from "@/core/domain/actor";

export function makeLogout(deps: { sessions: SessionRepository }) {
  return async (actor: Actor): Promise<void> => {
    if (actor.sessionId) await deps.sessions.end(actor.sessionId);
  };
}
