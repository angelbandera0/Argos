import "server-only";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import type { Actor } from "@/core/domain/actor";
import { readClaims } from "@/infrastructure/supabase/claims";
import { makeOrg } from "@/infrastructure/supabase/org-factory";
import { createServerClient } from "@/infrastructure/supabase/server-client";

export const ACTIVE_COMPANY_COOKIE = "argos_company";

/** Administrators and the superadmin (with a verified second factor) get through; anyone else sees a 404. */
export async function requireOrgUser() {
  const supabase = await createServerClient();
  const claims = await readClaims(supabase);
  if (!claims || claims.kind === "operator" || claims.aal !== "aal2" || claims.mustChangePassword) {
    notFound();
  }
  const actor: Actor = { userId: claims.userId, kind: claims.kind, channel: "ui" };
  return { supabase, actor, org: makeOrg(supabase) };
}

/** The administrator's active company, only if it is still one they can see. */
export async function getActiveCompanyId(): Promise<string | undefined> {
  const { actor, org } = await requireOrgUser();
  const id = (await cookies()).get(ACTIVE_COMPANY_COOKIE)?.value;
  if (!id) return undefined;
  return (await org.listCompanies(actor)).some((c) => c.id === id) ? id : undefined;
}
