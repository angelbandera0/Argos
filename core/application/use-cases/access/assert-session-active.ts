import type { Clock } from "@/core/application/ports/clock";
import type { AppSession, SessionRepository } from "@/core/application/ports/session-repository";
import type { StoreAccessReader } from "@/core/application/ports/store-access-reader";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, SessionExpired } from "@/core/domain/errors";
import { effectiveExpiry, isExpired } from "@/core/domain/session";

export interface SessionDeps {
  sessions: SessionRepository;
  access: StoreAccessReader;
  clock: Clock;
}

const DAY_SECONDS = 86400;

/** Shared by every operator use case: the session must exist, be open and not past its effective expiry. */
export async function assertSessionActive(deps: SessionDeps, actor: Actor): Promise<AppSession> {
  if (actor.kind !== "operator" || !actor.sessionId) throw new Forbidden();
  const session = await deps.sessions.get(actor.sessionId);
  if (!session || session.endedAt !== null) throw new SessionExpired();
  const current = session.activeStoreId
    ? await deps.access.getStoreAccess(actor.userId, session.activeStoreId)
    : null;
  const expiry = effectiveExpiry({
    startedAt: session.startedAt,
    companyCapSeconds: current?.companyCapSeconds ?? DAY_SECONDS,
    roleSeconds: current?.roleSessionSeconds ?? null,
  });
  if (isExpired(deps.clock.now(), expiry)) {
    await deps.sessions.end(session.sessionId);
    throw new SessionExpired();
  }
  return session;
}
