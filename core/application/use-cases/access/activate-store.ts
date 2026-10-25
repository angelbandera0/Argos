import type { Actor } from "@/core/domain/actor";
import { Forbidden, RuleViolation, SessionExpired } from "@/core/domain/errors";
import { effectiveExpiry, isExpired } from "@/core/domain/session";
import { assertSessionActive, type SessionDeps } from "./assert-session-active";

/** Shared by chooseStore and switchStore. startedAt is never changed (REQ-006 CA-10b). */
export async function activateStore(
  deps: SessionDeps,
  actor: Actor,
  storeId: string,
  opts: { requireActiveStore: boolean },
): Promise<void> {
  const session = await assertSessionActive(deps, actor);
  if (opts.requireActiveStore && session.activeStoreId === null) throw new Forbidden();
  const target = await deps.access.getStoreAccess(actor.userId, storeId);
  if (!target) throw new Forbidden();
  if (!target.operational) throw new RuleViolation("STORE_UNAVAILABLE");
  const expiry = effectiveExpiry({
    startedAt: session.startedAt,
    companyCapSeconds: target.companyCapSeconds,
    roleSeconds: target.roleSessionSeconds,
  });
  if (isExpired(deps.clock.now(), expiry)) {
    await deps.sessions.end(session.sessionId);
    throw new SessionExpired();
  }
  await deps.sessions.setActiveStore(session.sessionId, storeId);
}
