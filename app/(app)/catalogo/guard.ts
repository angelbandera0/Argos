import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { requireOperatorStore } from "@/core/application/use-cases/access/assert-session-active";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, RuleViolation, SessionExpired } from "@/core/domain/errors";
import type { PermissionSet } from "@/core/domain/permissions";
import { readClaims } from "@/infrastructure/supabase/claims";
import { makeCatalog } from "@/infrastructure/supabase/catalog-factory";
import { makeOrg } from "@/infrastructure/supabase/org-factory";
import { makeSessionRepository } from "@/infrastructure/supabase/session-repository";
import { createServerClient } from "@/infrastructure/supabase/server-client";
import { makeStoreAccessReader } from "@/infrastructure/supabase/store-access-reader";
import { ACTIVE_COMPANY_COOKIE } from "../companias/guard";

const ALL: PermissionSet = { view: true, create: true, edit: true, delete: true };

/**
 * Administrators work on the active company (cookie); operators on the company of their
 * active store, resolved through requireOperatorStore. The superadmin sees a 404.
 */
export async function requireCatalogUser() {
  const supabase = await createServerClient();
  const claims = await readClaims(supabase);
  if (!claims || claims.kind === "superadmin" || claims.mustChangePassword) notFound();
  const catalog = makeCatalog(supabase);
  if (claims.kind === "admin") {
    if (claims.aal !== "aal2") notFound();
    const actor: Actor = { userId: claims.userId, kind: "admin", channel: "ui" };
    const companies = await makeOrg(supabase).listCompanies(actor);
    const id = (await cookies()).get(ACTIVE_COMPANY_COOKIE)?.value;
    const company = companies.find((c) => c.id === id);
    return { actor, catalog, isAdmin: true, companyId: company?.id, companyName: company?.name, permissions: ALL };
  }
  if (!claims.sessionId) redirect("/tienda");
  const actor: Actor = { userId: claims.userId, kind: "operator", channel: "ui", sessionId: claims.sessionId };
  try {
    const { store } = await requireOperatorStore(
      { sessions: makeSessionRepository(supabase), access: makeStoreAccessReader(supabase), clock: { now: () => new Date() } },
      actor,
    );
    return { actor, catalog, isAdmin: false, companyId: store.companyId, companyName: undefined, permissions: store.permissions.products };
  } catch (e) {
    if (e instanceof Forbidden || e instanceof SessionExpired || e instanceof RuleViolation) redirect("/tienda");
    throw e;
  }
}

/** Categories are managed only by administrators. */
export async function requireCategoryAdmin() {
  const ctx = await requireCatalogUser();
  if (!ctx.isAdmin) notFound();
  return ctx;
}
