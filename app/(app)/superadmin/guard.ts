import "server-only";
import { notFound } from "next/navigation";
import type { Actor } from "@/core/domain/actor";
import { readClaims } from "@/infrastructure/supabase/claims";
import { createServerClient } from "@/infrastructure/supabase/server-client";

/** Only a superadmin with a verified second factor gets through; anyone else sees a 404. */
export async function requireSuperadmin() {
  const supabase = await createServerClient();
  const claims = await readClaims(supabase);
  if (!claims || claims.kind !== "superadmin" || claims.aal !== "aal2" || claims.mustChangePassword) {
    notFound();
  }
  const actor: Actor = { userId: claims.userId, kind: "superadmin", channel: "ui" };
  return { supabase, actor };
}
