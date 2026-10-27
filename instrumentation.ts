export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const email = process.env.SUPERADMIN_EMAIL;
  const initialPassword = process.env.SUPERADMIN_INITIAL_PASSWORD;
  if (!email || !initialPassword) return;
  const { makeAuthGateway } = await import("@/infrastructure/supabase/auth-gateway");
  const { makeEnsureSuperadmin } = await import(
    "@/core/application/use-cases/access/ensure-superadmin"
  );
  await makeEnsureSuperadmin({ auth: makeAuthGateway() })({ email, initialPassword });
}
