import "server-only";
import { createServerClient as createSsrClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { getEnv } from "@/infrastructure/env";

/** Supabase client acting with the signed-in user's JWT (cookie-based session). */
export async function createServerClient(): Promise<SupabaseClient> {
  await connection();
  const env = getEnv();
  const cookieStore = await cookies();
  return createSsrClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // The session is refreshed by proxy.ts, so this is safe to ignore.
          }
        },
      },
    },
  );
}
