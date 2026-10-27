"use server";

import { redirect } from "next/navigation";
import type { Actor } from "@/core/domain/actor";
import { RuleViolation, SessionExpired } from "@/core/domain/errors";
import { readClaims } from "@/infrastructure/supabase/claims";
import { enterWithPinFlow } from "@/infrastructure/supabase/pin-login";
import { createServerClient } from "@/infrastructure/supabase/server-client";
import { makeUsers } from "@/infrastructure/supabase/users-factory";

export interface EnterState {
  error?: string;
  username?: string;
}

const text = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string) : "");

export async function enterWithPin(_: EnterState, formData: FormData): Promise<EnterState> {
  const username = text(formData, "username").trim();
  const generic = { error: "Usuario o PIN incorrectos, o el usuario está bloqueado. Si sigue pasando, pide ayuda a un administrador.", username };
  const pin = text(formData, "pin");
  if (!username || !/^\d{6}$/.test(pin)) return generic;
  const supabase = await createServerClient();
  let result;
  try {
    result = await enterWithPinFlow(supabase, { username, pin });
  } catch {
    return generic;
  }
  if (!result) return generic;
  redirect("/tienda");
}

async function operatorContext(): Promise<{ actor: Actor; supabase: Awaited<ReturnType<typeof createServerClient>> } | null> {
  const supabase = await createServerClient();
  const claims = await readClaims(supabase);
  if (!claims || claims.kind !== "operator" || !claims.sessionId) return null;
  return {
    supabase,
    actor: { userId: claims.userId, kind: "operator", channel: "ui", sessionId: claims.sessionId },
  };
}

async function activate(formData: FormData, op: "chooseStore" | "switchStore") {
  const ctx = await operatorContext();
  if (!ctx) redirect("/entrar");
  try {
    await makeUsers(ctx.supabase)[op](ctx.actor, { storeId: text(formData, "storeId") });
  } catch (e) {
    if (e instanceof SessionExpired) redirect("/entrar");
    if (e instanceof RuleViolation && e.code === "STORE_UNAVAILABLE") redirect("/tienda?error=no-disponible");
    redirect("/tienda?error=1");
  }
  redirect("/");
}

export async function chooseStore(formData: FormData) {
  await activate(formData, "chooseStore");
}

export async function switchStore(formData: FormData) {
  await activate(formData, "switchStore");
}

export async function logout() {
  const ctx = await operatorContext();
  if (ctx) await makeUsers(ctx.supabase).logout(ctx.actor).catch(() => {});
  const supabase = ctx?.supabase ?? (await createServerClient());
  await supabase.auth.signOut();
  redirect("/entrar");
}
