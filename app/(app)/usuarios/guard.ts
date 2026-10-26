import "server-only";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { makeRoles } from "@/infrastructure/supabase/roles-factory";
import { makeUsers } from "@/infrastructure/supabase/users-factory";
import { ACTIVE_COMPANY_COOKIE, requireOrgUser } from "../companias/guard";

/** User management is for administrators only; the superadmin sees a 404. */
export async function requireUserAdmin() {
  const ctx = await requireOrgUser();
  if (ctx.actor.kind !== "admin") notFound();
  const id = (await cookies()).get(ACTIVE_COMPANY_COOKIE)?.value;
  const companies = await ctx.org.listCompanies(ctx.actor);
  const company = companies.find((c) => c.id === id);
  return { ...ctx, users: makeUsers(ctx.supabase), roles: makeRoles(ctx.supabase), company };
}

export interface StoreOption {
  id: string;
  name: string;
  site: string;
  active: boolean;
}

export async function loadStores(
  org: Awaited<ReturnType<typeof requireOrgUser>>["org"],
  companyId: string,
): Promise<StoreOption[]> {
  const sites = await org.sites.listByParent(companyId);
  const perSite = await Promise.all(
    sites.map(async (site) =>
      (await org.stores.listByParent(site.id)).map((s) => ({
        id: s.id,
        name: s.name,
        site: site.name,
        active: s.status === "active" && site.status === "active",
      })),
    ),
  );
  return perSite.flat();
}
