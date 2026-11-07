import "server-only";
import { notFound } from "next/navigation";
import { makeCurrencies } from "@/infrastructure/supabase/currencies-factory";
import { requireOrgUser } from "../companias/guard";

/** Currencies are managed only by administrators; the superadmin sees a 404. */
export async function requireCurrencyUser() {
  const ctx = await requireOrgUser();
  if (ctx.actor.kind !== "admin") notFound();
  return { ...ctx, currencies: makeCurrencies(ctx.supabase) };
}
