import "server-only";
import type { makeOrg } from "@/infrastructure/supabase/org-factory";

export type CompanySummary = { sites: number; stores: number; admin: string };

/** Counts and first administrator per company, read through RLS-bound repositories. */
export async function summarize(org: ReturnType<typeof makeOrg>, id: string): Promise<CompanySummary> {
  const [sites, adminIds] = await Promise.all([org.sites.listByParent(id), org.companies.listAdmins(id)]);
  const stores = await Promise.all(sites.map((s) => org.stores.listByParent(s.id)));
  const first = adminIds[0] ? await org.users.getProfile(adminIds[0]) : null;
  const extra = adminIds.length > 1 ? ` +${adminIds.length - 1}` : "";
  return { sites: sites.length, stores: stores.reduce((n, l) => n + l.length, 0), admin: first ? `${first.displayName}${extra}` : "—" };
}
