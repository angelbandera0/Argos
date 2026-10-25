import * as z from "zod";

const optionalString = z.string().min(1).optional();

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  PIN_PEPPER: z.string().min(32),
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  SUPERADMIN_EMAIL: optionalString,
  SUPERADMIN_INITIAL_PASSWORD: optionalString,
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(raw: Record<string, string | undefined>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const detail = result.error.issues
      .map((i) => `${i.path.join(".") || "(env)"}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid environment: ${detail}`);
  }
  return result.data;
}

let cached: Env | undefined;

/** Lazy: parses process.env on first use, never at import time. */
export function getEnv(): Env {
  cached ??= parseEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    PIN_PEPPER: process.env.PIN_PEPPER,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPERADMIN_EMAIL: process.env.SUPERADMIN_EMAIL,
    SUPERADMIN_INITIAL_PASSWORD: process.env.SUPERADMIN_INITIAL_PASSWORD,
  });
  return cached;
}
