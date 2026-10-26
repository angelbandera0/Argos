import "server-only";
import { notFound } from "next/navigation";
import { makeRoles } from "@/infrastructure/supabase/roles-factory";
import { requireOrgUser } from "../companias/guard";

/** Roles are managed only by administrators; the superadmin sees a 404. */
export async function requireRoleUser() {
  const ctx = await requireOrgUser();
  if (ctx.actor.kind !== "admin") notFound();
  return { ...ctx, roles: makeRoles(ctx.supabase) };
}
