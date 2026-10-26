import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { PinVerifier } from "@/core/application/ports/pin-verifier";
import { derivePinCredential, syntheticEmail } from "@/infrastructure/auth/pin";
import { getEnv } from "@/infrastructure/env";

function sessionIdOf(accessToken: string): string | null {
  const payload = JSON.parse(Buffer.from(accessToken.split(".")[1], "base64url").toString());
  return typeof payload.session_id === "string" ? payload.session_id : null;
}

export function makePinVerifier(): PinVerifier {
  return {
    async verify(username, pin) {
      const env = getEnv();
      const client = createClient(
        env.NEXT_PUBLIC_SUPABASE_URL,
        env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        { auth: { autoRefreshToken: false, persistSession: false } },
      );
      const { data, error } = await client.auth.signInWithPassword({
        email: syntheticEmail(username),
        password: derivePinCredential(username, pin, env.PIN_PEPPER),
      });
      if (error || !data.session) return null;
      const sessionId = sessionIdOf(data.session.access_token);
      return sessionId ? { userId: data.user.id, sessionId } : null;
    },
  };
}
