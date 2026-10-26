import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { makeAuthGateway } from "@/infrastructure/supabase/auth-gateway";
import { makePinVerifier } from "@/infrastructure/supabase/pin-verifier";
import { derivePinCredential, syntheticEmail } from "@/infrastructure/auth/pin";
import { createAdminClient } from "@/infrastructure/supabase/admin-client";

const admin = createAdminClient();
const gateway = makeAuthGateway(admin);
const verifier = makePinVerifier();
const run = randomBytes(3).toString("hex");
const code = `t${randomBytes(2).toString("hex").slice(0, 3)}`;
const username = `${code}.itest-${run}`;
const userIds: string[] = [];
const ids: { company?: string; site?: string; store?: string; role?: string } = {};
let adminId = "";
let operatorId = "";
let pin = "";
const errors: string[] = [];

async function capture<T>(p: Promise<T>): Promise<void> {
  try {
    await p;
  } catch (e) {
    errors.push((e as Error).message);
  }
}

beforeAll(async () => {
  const a = await gateway.createAdminUser({ email: `itest-${run}@example.com`, displayName: "itest admin" });
  adminId = a.userId;
  userIds.push(adminId);
  const company = await admin.from("companies").insert({ name: `itest-${run}`, code, founder_id: adminId }).select("id").single();
  ids.company = company.data?.id;
  const site = await admin.from("sites").insert({ company_id: ids.company, name: "itest site" }).select("id").single();
  ids.site = site.data?.id;
  const store = await admin.from("stores").insert({ company_id: ids.company, site_id: ids.site, name: "itest store" }).select("id").single();
  ids.store = store.data?.id;
  const role = await admin.from("roles").insert({ owner_id: adminId, name: `itest-${run}` }).select("id").single();
  ids.role = role.data?.id;
  expect(ids.role).toBeTruthy();
  const op = await gateway.createOperatorUser({
    username,
    companyId: ids.company!,
    displayName: "itest operator",
    assignments: [{ storeId: ids.store!, roleId: ids.role! }],
  });
  operatorId = op.userId;
  userIds.push(operatorId);
  pin = op.pin;
});

afterAll(async () => {
  await admin.from("user_stores").delete().in("user_id", userIds);
  await admin.from("profiles").delete().eq("id", operatorId);
  if (ids.store) await admin.from("stores").delete().eq("id", ids.store);
  if (ids.site) await admin.from("sites").delete().eq("id", ids.site);
  if (ids.role) await admin.from("roles").delete().eq("id", ids.role);
  if (ids.company) await admin.from("companies").delete().eq("id", ids.company);
  for (const id of userIds) await admin.auth.admin.deleteUser(id);
  await admin.from("audit_log").delete().in("entity_id", [...userIds, ...Object.values(ids)].filter(Boolean) as string[]);
  await admin.from("auth_events").delete().in("user_id", userIds);
});

describe("AuthGateway + PinVerifier", () => {
  it("creates an admin with a long temporary password and must_change_password", async () => {
    const { data } = await admin.from("profiles").select("kind, must_change_password").eq("id", adminId).single();
    expect(data).toEqual({ kind: "admin", must_change_password: true });
    const created = await admin.auth.admin.getUserById(adminId);
    expect(created.data.user?.app_metadata.must_change_password).toBe(true);
  });

  it("returns a 6 digit pin that logs the operator in; wrong pin and unknown user give null", async () => {
    expect(pin).toMatch(/^\d{6}$/);
    const ok = await verifier.verify(username, pin);
    expect(ok?.userId).toBe(operatorId);
    expect(ok?.sessionId).toMatch(/^[0-9a-f-]{36}$/);
    const other = pin === "000000" ? "000001" : "000000";
    expect(await verifier.verify(username, other)).toBeNull();
    expect(await verifier.verify(`${code}.itest-nobody-${run}`, pin)).toBeNull();
  });

  it("writes the profile and the store assignments", async () => {
    const p = await admin.from("profiles").select("kind, username, company_id").eq("id", operatorId).single();
    expect(p.data).toEqual({ kind: "operator", username, company_id: ids.company });
    const us = await admin.from("user_stores").select("store_id, role_id").eq("user_id", operatorId);
    expect(us.data).toEqual([{ store_id: ids.store, role_id: ids.role }]);
  });

  it("resetPin invalidates the old pin and the new one works", async () => {
    const old = pin;
    const { pin: fresh } = await gateway.resetPin(operatorId);
    expect(fresh).toMatch(/^\d{6}$/);
    if (fresh !== old) expect(await verifier.verify(username, old)).toBeNull();
    expect((await verifier.verify(username, fresh))?.userId).toBe(operatorId);
    pin = fresh;
  });

  it("revokeSessions kills a previous refresh token", async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const client = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data } = await client.auth.signInWithPassword({
      email: syntheticEmail(username),
      password: derivePinCredential(username, pin, process.env.PIN_PEPPER!),
    });
    const refresh = data.session!.refresh_token;
    await gateway.revokeSessions(operatorId);
    const again = await client.auth.refreshSession({ refresh_token: refresh });
    expect(again.error).not.toBeNull();
    expect(again.data.session).toBeNull();
  });

  it("setPassword changes the password and clears must_change_password", async () => {
    const password = `Itest-${randomBytes(9).toString("base64url")}`;
    await gateway.setPassword(adminId, password);
    const { data } = await admin.from("profiles").select("must_change_password").eq("id", adminId).single();
    expect(data?.must_change_password).toBe(false);
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false },
    });
    const email = (await admin.auth.admin.getUserById(adminId)).data.user!.email!;
    expect((await client.auth.signInWithPassword({ email, password })).error).toBeNull();
  });

  it("rolls back the auth user when the profile insert fails", async () => {
    await capture(
      gateway.createOperatorUser({
        username: `zzzz.itest-${run}`,
        companyId: ids.company!,
        displayName: "bad code",
        assignments: [],
      }),
    );
    const list = await admin.auth.admin.listUsers({ perPage: 1000 });
    expect(list.data.users.some((u) => u.email === syntheticEmail(`zzzz.itest-${run}`))).toBe(false);
  });

  it("never leaks the pin or a password in error messages", async () => {
    const secretPassword = `Itest-secret-${randomBytes(6).toString("hex")}`;
    await capture(gateway.setPassword("00000000-0000-0000-0000-000000000000", secretPassword));
    await capture(gateway.setPassword("not-a-uuid", secretPassword));
    await capture(gateway.resetPin("00000000-0000-0000-0000-000000000000"));
    await capture(gateway.revokeSessions("not-a-uuid"));
    await capture(
      gateway.createOperatorUser({ username: `zzzz.itest-${run}`, companyId: ids.company!, displayName: "x", assignments: [] }),
    );
    await capture(gateway.createAdminUser({ email: "not-an-email", displayName: "x" }));
    expect(errors.length).toBeGreaterThanOrEqual(5);
    for (const message of errors) {
      expect(message).not.toContain(secretPassword);
      expect(message).not.toContain(pin);
    }
  });
});
