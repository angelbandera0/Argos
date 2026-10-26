import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { requireOperatorStore } from "@/core/application/use-cases/access/assert-session-active";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, RuleViolation, SessionExpired } from "@/core/domain/errors";
import { HISTORY_MODULES } from "@/components/history/history-utils";
import { readClaims } from "@/infrastructure/supabase/claims";
import { makeHistory } from "@/infrastructure/supabase/history-factory";
import { makeOrg } from "@/infrastructure/supabase/org-factory";
import { createServerClient } from "@/infrastructure/supabase/server-client";
import { makeSessionRepository } from "@/infrastructure/supabase/session-repository";
import { makeStoreAccessReader } from "@/infrastructure/supabase/store-access-reader";
import { makeUsers } from "@/infrastructure/supabase/users-factory";
import { ACTIVE_COMPANY_COOKIE } from "../companias/guard";

/**
 * Administrators read the active company (cookie), the superadmin every company (companyId undefined),
 * operators the company of their active store and only the modules where their role has «Ver».
 */
export async function requireHistoryUser() {
  const supabase = await createServerClient();
  const claims = await readClaims(supabase);
  if (!claims || claims.mustChangePassword) notFound();
  const history = makeHistory(supabase);
  const users = makeUsers(supabase);
  if (claims.kind !== "operator") {
    if (claims.aal !== "aal2") notFound();
    const actor: Actor = { userId: claims.userId, kind: claims.kind, channel: "ui" };
    let companyId: string | undefined;
    if (claims.kind === "admin") {
      const id = (await cookies()).get(ACTIVE_COMPANY_COOKIE)?.value;
      companyId = (await makeOrg(supabase).listCompanies(actor)).find((c) => c.id === id)?.id;
    }
    return { actor, history, users, companyId, isAdmin: true, modules: Object.keys(HISTORY_MODULES) };
  }
  if (!claims.sessionId) redirect("/tienda");
  const actor: Actor = { userId: claims.userId, kind: "operator", channel: "ui", sessionId: claims.sessionId };
  try {
    const { store } = await requireOperatorStore(
      { sessions: makeSessionRepository(supabase), access: makeStoreAccessReader(supabase), clock: { now: () => new Date() } },
      actor,
    );
    const modules = Object.entries(store.permissions)
      .filter(([m, p]) => p.view && m in HISTORY_MODULES)
      .map(([m]) => m);
    return { actor, history, users, companyId: store.companyId, isAdmin: false, modules };
  } catch (e) {
    if (e instanceof Forbidden || e instanceof SessionExpired || e instanceof RuleViolation) redirect("/tienda");
    throw e;
  }
}

export async function requireAccessAdmin() {
  const ctx = await requireHistoryUser();
  if (!ctx.isAdmin) notFound();
  return ctx;
}

export async function actorNames(users: Awaited<ReturnType<typeof requireHistoryUser>>["users"], companyId?: string) {
  if (!companyId) return [];
  try {
    return await users.users.listForCompany(companyId);
  } catch {
    return [];
  }
}
