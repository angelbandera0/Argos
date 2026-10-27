import type { Clock } from "@/core/application/ports/clock";
import type { AppSession, SessionRepository } from "@/core/application/ports/session-repository";
import type { StoreAccess, StoreAccessReader } from "@/core/application/ports/store-access-reader";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, RuleViolation, SessionExpired } from "@/core/domain/errors";
import { effectiveExpiry, isExpired } from "@/core/domain/session";

export interface SessionDeps {
  sessions: SessionRepository;
  access: StoreAccessReader;
  clock: Clock;
}

const DAY_SECONDS = 86400;

/**
 * Shared by every operator use case: the session must exist, belong to the actor, be open and
 * not past its effective expiry. `activeStore` is the active store's access only while the
 * assignment still exists and the store is operational; otherwise null (the user may still
 * choose or switch to another store, DR-015).
 */
export async function assertSessionActive(
  deps: SessionDeps,
  actor: Actor,
): Promise<{ session: AppSession; activeStore: StoreAccess | null }> {
  const { session, assignment } = await loadSession(deps, actor);
  return { session, activeStore: assignment?.operational ? assignment : null };
}

/** For use cases that act inside the active store. */
export async function requireOperatorStore(
  deps: SessionDeps,
  actor: Actor,
): Promise<{ session: AppSession; store: StoreAccess }> {
  const { session, assignment } = await loadSession(deps, actor);
  if (!session.activeStoreId || !assignment) throw new Forbidden();
  if (!assignment.operational) throw new RuleViolation("STORE_UNAVAILABLE");
  return { session, store: assignment };
}

async function loadSession(
  deps: SessionDeps,
  actor: Actor,
): Promise<{ session: AppSession; assignment: StoreAccess | null }> {
  if (actor.kind !== "operator" || !actor.sessionId) throw new Forbidden();
  const session = await deps.sessions.get(actor.sessionId);
  // A foreign session looks exactly like a missing one and is left untouched.
  if (!session || session.userId !== actor.userId || session.endedAt !== null) {
    throw new SessionExpired();
  }
  const assignment = session.activeStoreId
    ? await deps.access.getStoreAccess(actor.userId, session.activeStoreId)
    : null;
  const expiry = effectiveExpiry({
    startedAt: session.startedAt,
    companyCapSeconds: assignment?.companyCapSeconds ?? DAY_SECONDS,
    roleSeconds: assignment?.roleSessionSeconds ?? null,
  });
  if (isExpired(deps.clock.now(), expiry)) {
    await deps.sessions.end(session.sessionId);
    throw new SessionExpired();
  }
  return { session, assignment };
}
