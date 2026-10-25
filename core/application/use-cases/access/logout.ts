import type { SessionRepository } from "@/core/application/ports/session-repository";
import type { Actor } from "@/core/domain/actor";

export function makeLogout(deps: { sessions: SessionRepository }) {
  return async (actor: Actor): Promise<void> => {
    if (!actor.sessionId) return;
    const session = await deps.sessions.get(actor.sessionId);
    // Never end a session that belongs to someone else.
    if (session && session.userId === actor.userId) await deps.sessions.end(session.sessionId);
  };
}
