import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActorKind } from "@/core/domain/actor";

export interface SessionClaims {
  userId: string;
  email: string;
  kind: ActorKind;
  aal: "aal1" | "aal2";
  mustChangePassword: boolean;
  sessionId: string | null;
}

const KINDS: readonly string[] = ["superadmin", "admin", "operator"];

export async function readClaims(client: SupabaseClient): Promise<SessionClaims | null> {
  const { data } = await client.auth.getClaims();
  const claims = data?.claims as Record<string, unknown> | undefined;
  if (!claims) return null;
  const meta = (claims.app_metadata ?? {}) as Record<string, unknown>;
  const kind = claims.user_kind ?? meta.user_kind;
  if (typeof claims.sub !== "string" || typeof kind !== "string" || !KINDS.includes(kind)) {
    return null;
  }
  return {
    userId: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
    kind: kind as ActorKind,
    aal: claims.aal === "aal2" ? "aal2" : "aal1",
    mustChangePassword: meta.must_change_password === true,
    sessionId: typeof claims.session_id === "string" ? claims.session_id : null,
  };
}
