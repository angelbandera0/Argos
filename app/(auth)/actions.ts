"use server";

import { redirect } from "next/navigation";
import { RuleViolation } from "@/core/domain/errors";
import { getContainer } from "@/infrastructure/container";
import { makeMfaGateway } from "@/infrastructure/supabase/auth-gateway";
import { readClaims } from "@/infrastructure/supabase/claims";
import { createServerClient } from "@/infrastructure/supabase/server-client";

export interface FormState {
  error?: string;
  email?: string;
  sent?: boolean;
}

const text = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string) : "");

export async function signInAdmin(_: FormState, formData: FormData): Promise<FormState> {
  const email = text(formData, "email").trim();
  const generic = { error: "Correo o contraseña incorrectos.", email };
  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: text(formData, "password"),
  });
  if (error) return generic;
  const claims = await readClaims(supabase);
  if (!claims || claims.kind === "operator") {
    await supabase.auth.signOut();
    return generic;
  }
  if (claims.mustChangePassword || !(await makeMfaGateway(supabase).hasTotp())) {
    redirect("/primer-ingreso");
  }
  redirect("/login/2fa");
}

export async function verifyTotp(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createServerClient();
  const claims = await readClaims(supabase);
  if (!claims || claims.kind === "operator" || claims.mustChangePassword) redirect("/login");
  const code = text(formData, "code").replace(/\D/g, "");
  const factorId = text(formData, "factorId") || undefined;
  try {
    await makeMfaGateway(supabase).verifyTotp({ code, factorId });
  } catch {
    return { error: "El código es incorrecto o ya venció. Prueba con uno nuevo." };
  }
  redirect("/");
}

export async function startTotpEnrollment() {
  const supabase = await createServerClient();
  const claims = await readClaims(supabase);
  if (!claims || claims.kind === "operator" || claims.mustChangePassword) return null;
  try {
    return await makeMfaGateway(supabase).enrollTotp();
  } catch {
    return null;
  }
}

export async function completeFirstLogin(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createServerClient();
  const claims = await readClaims(supabase);
  // Only the temporary-password step (or a fully authenticated admin) may change it.
  if (!claims || !(claims.mustChangePassword || claims.aal === "aal2")) redirect("/login");
  const newPassword = text(formData, "password");
  if (newPassword !== text(formData, "confirm")) {
    return { error: "Las contraseñas no coinciden." };
  }
  try {
    await getContainer().changeOwnPassword(
      { userId: claims.userId, kind: claims.kind, channel: "ui" },
      { newPassword },
    );
  } catch (e) {
    if (e instanceof RuleViolation && e.code === "PASSWORD_TOO_SHORT") {
      return { error: "La contraseña debe tener al menos 12 caracteres." };
    }
    return { error: "No se pudo cambiar la contraseña. Inténtalo de nuevo." };
  }
  // Changing the password revokes the refresh tokens; sign in again for a JWT with fresh claims.
  const { error } = await supabase.auth.signInWithPassword({ email: claims.email, password: newPassword });
  if (error) redirect("/login");
  await readClaims(supabase); // lets the cookie write finish before redirecting
  redirect("/primer-ingreso");
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createServerClient();
  // Same answer whether or not the address exists (or the call fails).
  await supabase.auth.resetPasswordForEmail(text(formData, "email").trim()).catch(() => {});
  return { sent: true };
}

export async function signOutAdmin() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
