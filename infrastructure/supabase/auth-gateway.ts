import "server-only";
import { randomBytes, randomInt } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthGateway } from "@/core/application/ports/auth-gateway";
import type { MfaGateway } from "@/core/application/ports/mfa-gateway";
import { normalizeUsername } from "@/core/domain/username";
import { derivePinCredential, generatePin, syntheticEmail } from "@/infrastructure/auth/pin";
import { getEnv } from "@/infrastructure/env";
import { createAdminClient } from "@/infrastructure/supabase/admin-client";

function fail(op: string, error: { code?: string; status?: number }): never {
  throw new Error(`AuthGateway.${op} failed (${error.code ?? error.status ?? "unknown"})`);
}

function temporaryPassword(): string {
  return randomBytes(18).toString("base64url");
}

export function makeAuthGateway(
  admin: SupabaseClient = createAdminClient(),
  randomIntFn: (max: number) => number = randomInt,
): AuthGateway {
  async function createWithProfile(
    op: string,
    user: { email: string; password: string; appMetadata?: Record<string, unknown> },
    profile: Record<string, unknown>,
    assignments: { store_id: string; company_id: string; role_id: string }[] = [],
  ): Promise<string> {
    const created = await admin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      app_metadata: user.appMetadata,
    });
    if (created.error || !created.data.user) fail(op, created.error ?? {});
    const userId = created.data.user.id;
    const rollback = async () => {
      await admin.from("user_stores").delete().eq("user_id", userId);
      await admin.auth.admin.deleteUser(userId);
    };
    const inserted = await admin.from("profiles").insert({ id: userId, ...profile });
    if (inserted.error) {
      await rollback();
      fail(op, inserted.error);
    }
    if (assignments.length > 0) {
      const linked = await admin
        .from("user_stores")
        .insert(assignments.map((a) => ({ user_id: userId, ...a })));
      if (linked.error) {
        await rollback();
        fail(op, linked.error);
      }
    }
    return userId;
  }

  async function setPin(userId: string, username: string): Promise<string> {
    const pin = generatePin(randomIntFn);
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password: derivePinCredential(username, pin, getEnv().PIN_PEPPER),
    });
    if (error) fail("resetPin", error);
    return pin;
  }

  return {
    async createAdminUser({ email, displayName }) {
      const password = temporaryPassword();
      const userId = await createWithProfile(
        "createAdminUser",
        { email, password, appMetadata: { must_change_password: true } },
        { kind: "admin", display_name: displayName, must_change_password: true },
      );
      return { userId, temporaryPassword: password };
    },

    async createOperatorUser({ username, companyId, displayName, assignments }) {
      const name = normalizeUsername(username);
      const pin = generatePin(randomIntFn);
      const userId = await createWithProfile(
        "createOperatorUser",
        {
          email: syntheticEmail(name),
          password: derivePinCredential(name, pin, getEnv().PIN_PEPPER),
        },
        { kind: "operator", username: name, company_id: companyId, display_name: displayName },
        assignments.map((a) => ({ store_id: a.storeId, company_id: companyId, role_id: a.roleId })),
      );
      return { userId, pin };
    },

    async resetPin(userId) {
      const { data, error } = await admin
        .from("profiles")
        .select("username")
        .eq("id", userId)
        .eq("kind", "operator")
        .maybeSingle();
      if (error || !data?.username) fail("resetPin", error ?? {});
      return { pin: await setPin(userId, data.username) };
    },

    async setPassword(userId, password) {
      const { error } = await admin.auth.admin.updateUserById(userId, {
        password,
        app_metadata: { must_change_password: false },
      });
      if (error) fail("setPassword", error);
      const updated = await admin
        .from("profiles")
        .update({ must_change_password: false })
        .eq("id", userId);
      if (updated.error) fail("setPassword", updated.error);
    },

    async revokeSessions(userId) {
      const { error } = await admin.rpc("revoke_user_sessions", { p_user_id: userId });
      if (error) fail("revokeSessions", error);
    },

    async ensureSuperadmin({ email, initialPassword }) {
      const exists = async () => {
        const r = await admin.from("profiles").select("id").eq("kind", "superadmin").maybeSingle();
        if (r.error) fail("ensureSuperadmin", r.error);
        return r.data !== null;
      };
      if (await exists()) return { created: false };
      try {
        await createWithProfile(
          "ensureSuperadmin",
          { email, password: initialPassword, appMetadata: { must_change_password: true } },
          { kind: "superadmin", display_name: "Superadmin", must_change_password: true },
        );
        return { created: true };
      } catch (e) {
        for (let n = 0; n < 10; n++) {
          if (await exists()) return { created: false };
          await new Promise((r) => setTimeout(r, 300));
        }
        throw e;
      }
    },
  };
}

export function makeMfaGateway(client: SupabaseClient): MfaGateway {
  async function totpFactors() {
    const { data, error } = await client.auth.mfa.listFactors();
    if (error) fail("listFactors", error);
    return data.all.filter((f) => f.factor_type === "totp");
  }

  return {
    async hasTotp() {
      return (await totpFactors()).some((f) => f.status === "verified");
    },

    async enrollTotp() {
      const factors = await totpFactors();
      if (factors.some((f) => f.status === "verified")) fail("enrollTotp", { code: "has_factor" });
      for (const f of factors) await client.auth.mfa.unenroll({ factorId: f.id });
      const { data, error } = await client.auth.mfa.enroll({ factorType: "totp", issuer: "Argos" });
      if (error) fail("enrollTotp", error);
      return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
    },

    async verifyTotp({ code, factorId }) {
      const id = factorId ?? (await totpFactors()).find((f) => f.status === "verified")?.id;
      if (!id) fail("verifyTotp", { code: "no_factor" });
      const { error } = await client.auth.mfa.challengeAndVerify({ factorId: id, code });
      if (error) fail("verifyTotp", error);
    },
  };
}
