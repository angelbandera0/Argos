import "server-only";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { makeCurrencies } from "@/infrastructure/supabase/currencies-factory";
import { ACTIVE_COMPANY_COOKIE, requireOrgUser } from "../companias/guard";

/** Currencies are managed only by administrators; the superadmin sees a 404. */
export async function requireCurrencyUser() {
  const ctx = await requireOrgUser();
  if (ctx.actor.kind !== "admin") notFound();
  return { ...ctx, currencies: makeCurrencies(ctx.supabase) };
}

/** Active-company cookie, falling back to the first administered company. */
export async function activeCompanyId(ctx: Awaited<ReturnType<typeof requireCurrencyUser>>) {
  const companies = await ctx.org.listCompanies(ctx.actor);
  const cookieId = (await cookies()).get(ACTIVE_COMPANY_COOKIE)?.value;
  return companies.find((c) => c.id === cookieId)?.id ?? companies[0]?.id;
}
