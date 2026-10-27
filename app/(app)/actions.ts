"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signOutPath } from "@/core/application/use-cases/access/sign-out-path";
import type { ActorKind } from "@/core/domain/actor";
import { readClaims } from "@/infrastructure/supabase/claims";
import { createServerClient } from "@/infrastructure/supabase/server-client";
import { makeUsers } from "@/infrastructure/supabase/users-factory";
import { ACTIVE_COMPANY_COOKIE } from "./companias/guard";

export async function signOut() {
  let kind: ActorKind | null = null;
  try {
    const supabase = await createServerClient();
    const claims = await readClaims(supabase);
    kind = claims?.kind ?? null;
    if (claims) {
      await makeUsers(supabase)
        .logout({ userId: claims.userId, kind: claims.kind, channel: "ui", sessionId: claims.sessionId ?? undefined })
        .catch(() => {});
    }
    await supabase.auth.signOut({ scope: "local" }).catch(() => {});
    (await cookies()).delete(ACTIVE_COMPANY_COOKIE);
  } catch {
    // An expired or broken session still ends on the sign-in page.
  }
  redirect(signOutPath(kind));
}
