import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { PinVerifier } from "@/core/application/ports/pin-verifier";
import { derivePinCredential, syntheticEmail } from "@/infrastructure/auth/pin";
import { getEnv } from "@/infrastructure/env";
import { createAdminClient } from "@/infrastructure/supabase/admin-client";

function sessionIdOf(accessToken: string): string | null {
  const payload = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString());
  return typeof payload.session_id === "string" ? payload.session_id : null;
}

/**
 * `client` is the one whose session is established by a successful login (the request's cookie
 * client in the server action); by default a throwaway client is used.
 */
export function makePinVerifier(
  client?: SupabaseClient,
  admin: () => SupabaseClient = createAdminClient,
): PinVerifier {
  return {
    async verify(username, pin) {
      const env = getEnv();
      const name = username.trim().toLowerCase();
      const profile = await admin()
        .from("profiles")
        .select("status")
        .eq("username", name)
        .eq("kind", "operator")
        .is("deleted_at", null)
        .maybeSingle();
      if (profile.error || profile.data?.status !== "active") return null;
      const signer =
        client ??
        createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false },
        });
      const { data, error } = await signer.auth.signInWithPassword({
        email: syntheticEmail(name),
        password: derivePinCredential(name, pin, env.PIN_PEPPER),
      });
      if (error || !data.session) return null;
      const sessionId = sessionIdOf(data.session.access_token);
      return sessionId ? { userId: data.user.id, sessionId } : null;
    },
  };
}
