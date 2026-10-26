import { createHmac, randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { Actor } from "@/core/domain/actor";
import { createAdminClient } from "@/infrastructure/supabase/admin-client";
import { makeAuthGateway, makeMfaGateway } from "@/infrastructure/supabase/auth-gateway";
import { readClaims } from "@/infrastructure/supabase/claims";
import { makeCompanyRepository } from "@/infrastructure/supabase/company-repository";
import { enterWithPinFlow } from "@/infrastructure/supabase/pin-login";
import { makeRoleRepository } from "@/infrastructure/supabase/role-repository";
import { makeSiteRepository } from "@/infrastructure/supabase/site-repository";
import { makeStoreRepository } from "@/infrastructure/supabase/store-repository";
import { makeUserRepository } from "@/infrastructure/supabase/user-repository";
import { makeUsers } from "@/infrastructure/supabase/users-factory";

const admin = createAdminClient();
const gateway = makeAuthGateway(admin);
const run = randomBytes(3).toString("hex");
const adminIds: string[] = [];
const operatorIds: string[] = [];
const companyIds: string[] = [];
const pins: string[] = [];
const output: string[] = [];

function totp(secret: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const ch of secret.replace(/=+$/, "").toUpperCase()) bits += alphabet.indexOf(ch).toString(2).padStart(5, "0");
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const h = createHmac("sha1", key).update(counter).digest();
  const o = h[h.length - 1] & 0xf;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

const fresh = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

async function aal2Admin(tag: string): Promise<{ id: string; client: SupabaseClient; actor: Actor }> {
  const email = `itest-t28-${run}-${tag}@example.com`;
  const created = await gateway.createAdminUser({ email, displayName: `itest t28 ${tag}` });
  adminIds.push(created.userId);
  const client = fresh();
  expect((await client.auth.signInWithPassword({ email, password: created.temporaryPassword })).error).toBeNull();
  const mfa = makeMfaGateway(client);
  const { factorId, secret } = await mfa.enrollTotp();
  await mfa.verifyTotp({ code: totp(secret), factorId });
  return { id: created.userId, client, actor: { userId: created.userId, kind: "admin", channel: "ui" } };
}

type AdminCtx = Awaited<ReturnType<typeof aal2Admin>>;
let a: AdminCtx;
let b: AdminCtx;
let companyId: string;
let storeA: string;
let storeB: string;
let roleId: string;
let productId: string;
const spies: ReturnType<typeof vi.spyOn>[] = [];

async function operatorSession(userId: string) {
  const client = fresh();
  return { client, userId };
}

async function newOperator(name: string): Promise<{ id: string; username: string; pin: string }> {
  const created = await makeUsers(a.client).createOperator(a.actor, {
    companyId,
    name: `itest${run}${name}`,
    displayName: `itest t28 ${name}`,
    roleId,
    storeIds: [storeA, storeB],
  });
  operatorIds.push(created.userId);
  pins.push(created.pin);
  return { id: created.userId, username: created.username, pin: created.pin };
}

function actorOf(claims: { userId: string; sessionId: string | null }): Actor {
  return { userId: claims.userId, kind: "operator", channel: "ui", sessionId: claims.sessionId! };
}

beforeAll(async () => {
  for (const m of ["log", "info", "warn", "error", "debug"] as const) {
    spies.push(vi.spyOn(console, m).mockImplementation((...args: unknown[]) => void output.push(args.map(String).join(" "))));
  }
  a = await aal2Admin("a");
  b = await aal2Admin("b");
  const c = await makeCompanyRepository(a.client).create({ name: `itest-t28-${run}`, founderId: a.id });
  companyIds.push(c.id);
  companyId = c.id;
  const site = await makeSiteRepository(a.client).create({ companyId, name: `itest-t28-${run} sede` });
  storeA = (await makeStoreRepository(a.client).create({ companyId, siteId: site.id, name: "Tienda A" })).id;
  storeB = (await makeStoreRepository(a.client).create({ companyId, siteId: site.id, name: "Tienda B" })).id;
  const role = await makeRoleRepository(a.client).create({
    ownerId: a.id,
    name: `itest-t28-${run} Cajero`,
    sessionSeconds: null,
    excludedCompanyIds: [],
    permissions: { products: { view: true, create: false, edit: false, delete: false } },
  });
  roleId = role.id;
  const cat = await admin.from("categories").insert({ company_id: companyId, name: "itest cat" }).select("id").single();
  const prod = await admin.from("products").insert({ company_id: companyId, category_id: cat.data!.id, name: "itest producto" }).select("id").single();
  productId = prod.data!.id;
});

afterAll(async () => {
  spies.forEach((s) => s.mockRestore());
  await admin.from("app_sessions").delete().in("user_id", operatorIds);
  if (companyIds.length) await admin.from("user_stores").delete().in("company_id", companyIds);
  for (const id of operatorIds) await admin.auth.admin.deleteUser(id);
  const rids = adminIds.length ? ((await admin.from("roles").select("id").in("owner_id", adminIds)).data ?? []).map((r) => r.id) : [];
  if (rids.length) {
    await admin.from("role_company_exclusions").delete().in("role_id", rids);
    await admin.from("role_permissions").delete().in("role_id", rids);
    await admin.from("roles").delete().in("id", rids);
  }
  for (const id of companyIds) {
    const { error } = await admin.rpc("delete_test_company", { p_company: id });
    expect(error).toBeNull();
  }
  for (const id of adminIds) {
    const factors = await admin.auth.admin.mfa.listFactors({ userId: id });
    for (const f of factors.data?.factors ?? []) await admin.auth.admin.mfa.deleteFactor({ id: f.id, userId: id });
    await admin.auth.admin.deleteUser(id);
  }
  expect((await admin.from("companies").select("id").like("name", `itest-t28-${run}%`)).data).toEqual([]);
  expect((await admin.from("profiles").select("id").like("username", `%.itest${run}%`)).data).toEqual([]);
  expect((await admin.from("roles").select("id").like("name", `itest-t28-${run}%`)).data).toEqual([]);
  const users = await admin.auth.admin.listUsers({ perPage: 200 });
  expect(users.data.users.filter((u) => u.email?.includes(`t28-${run}`) || u.email?.includes(`.itest${run}`))).toEqual([]);
});

describe("operators and PIN login", () => {
  let op: { id: string; username: string; pin: string };

  it("full flow: enter with the PIN, choose a store, read products by role, switch store without PIN", async () => {
    op = await newOperator("a");
    expect(op.pin).toMatch(/^\d{6}$/);
    expect(await makeRoleRepository(a.client).hasAssignments(roleId)).toBe(true);

    const { client } = await operatorSession(op.id);
    const entered = await enterWithPinFlow(client, { username: op.username, pin: op.pin });
    expect(entered).not.toBeNull();
    expect(entered!.stores).toHaveLength(2);
    expect(entered!.stores.every((s) => s.available)).toBe(true);
    expect(entered!.stores[0].permissions.products).toEqual({ view: true, create: false, edit: false, delete: false });

    const claims = (await readClaims(client))!;
    expect(claims.sessionId).toBe(entered!.sessionId);
    const users = makeUsers(client);
    expect((await client.from("products").select("id")).data).toEqual([]);
    await users.chooseStore(actorOf(claims), { storeId: storeA });
    expect((await client.from("products").select("id")).data).toEqual([{ id: productId }]);

    const before = (await users.sessions.get(claims.sessionId!))!;
    await users.switchStore(actorOf(claims), { storeId: storeB });
    const after = (await users.sessions.get(claims.sessionId!))!;
    expect(after.activeStoreId).toBe(storeB);
    expect(after.startedAt).toEqual(before.startedAt);

    const events = await admin.from("auth_events").select("event").eq("user_id", op.id);
    expect(events.data).toContainEqual({ event: "login_ok" });
  });

  it("an unknown user, a wrong PIN and a locked user all get the same answer; unlock restores access", async () => {
    const lock = await newOperator("b");
    expect(await enterWithPinFlow(fresh(), { username: `zzzz.itest${run}nadie`, pin: "123456" })).toBeNull();
    const wrong = lock.pin === "000000" ? "000001" : "000000";
    for (let i = 0; i < 5; i++) {
      expect(await enterWithPinFlow(fresh(), { username: lock.username, pin: wrong })).toBeNull();
    }
    const status = await admin.from("profiles").select("status").eq("id", lock.id).single();
    expect(status.data!.status).toBe("locked");
    expect(await enterWithPinFlow(fresh(), { username: lock.username, pin: lock.pin })).toBeNull();

    const { error } = await fresh().auth.signInWithPassword({
      email: `${lock.username}@operadores.argos.invalid`,
      password: "x",
    });
    expect(error).not.toBeNull();

    const unlocked = await makeUsers(a.client).unlockUser(a.actor, { userId: lock.id });
    pins.push(unlocked.pin);
    expect((await admin.from("profiles").select("status").eq("id", lock.id).single()).data!.status).toBe("active");
    expect(await enterWithPinFlow(fresh(), { username: lock.username, pin: lock.pin })).toBeNull();
    expect(await enterWithPinFlow(fresh(), { username: lock.username, pin: unlocked.pin })).not.toBeNull();
  });

  it("a deactivated operator cannot enter", async () => {
    const gone = await newOperator("c");
    await makeUsers(a.client).deactivateUser(a.actor, { userId: gone.id });
    expect(await enterWithPinFlow(fresh(), { username: gone.username, pin: gone.pin })).toBeNull();
  });

  it("only the role owner can change assignments (REQ-007 CA-11) and stores stay unique", async () => {
    const target = await newOperator("d");
    await makeCompanyRepository(a.client).grantAccess(companyId, b.id, a.id);
    const asB = makeUserRepository(b.client);
    await expect(asB.assignStores(target.id, [])).rejects.toMatchObject({ name: "Forbidden" });
    expect(await asB.listAssignments(target.id)).toHaveLength(2);
    expect((await b.client.from("user_stores").delete().eq("user_id", target.id).select()).data).toEqual([]);

    const asA = makeUserRepository(a.client);
    await asA.assignStores(target.id, [{ storeId: storeA, roleId }]);
    expect(await asA.listAssignments(target.id)).toEqual([{ userId: target.id, storeId: storeA, roleId }]);
    await expect(
      asA.assignStores(target.id, [
        { storeId: storeA, roleId },
        { storeId: storeA, roleId },
      ]),
    ).rejects.toThrow();
    expect(await asA.listAssignments(target.id)).toHaveLength(1);
  });

  it("setting app_sessions.ended_at hides data even though the token is still valid", async () => {
    const other = await newOperator("e");
    const { client } = await operatorSession(other.id);
    expect(await enterWithPinFlow(client, { username: other.username, pin: other.pin })).not.toBeNull();
    const claims = (await readClaims(client))!;
    const users = makeUsers(client);
    await users.chooseStore(actorOf(claims), { storeId: storeA });
    expect((await client.from("products").select("id")).data).toHaveLength(1);

    await admin.from("app_sessions").update({ ended_at: new Date().toISOString() }).eq("session_id", claims.sessionId!);
    expect((await client.from("products").select("id")).data).toEqual([]);
    await expect(users.sessions.setActiveStore(claims.sessionId!, storeB)).rejects.toMatchObject({ name: "SessionExpired" });
  });

  it("sign-out: operator ends app_sessions and the token loses access; repeating on an expired session does not fail", async () => {
    const other = await newOperator("so");
    const { client } = await operatorSession(other.id);
    expect(await enterWithPinFlow(client, { username: other.username, pin: other.pin })).not.toBeNull();
    const claims = (await readClaims(client))!;
    const users = makeUsers(client);
    await users.chooseStore(actorOf(claims), { storeId: storeA });
    expect((await client.from("products").select("id")).data).toHaveLength(1);

    await users.logout(actorOf(claims));
    expect((await admin.from("app_sessions").select("ended_at").eq("session_id", claims.sessionId!).single()).data!.ended_at).not.toBeNull();
    expect((await client.from("products").select("id")).data).toEqual([]);
    expect((await client.auth.signOut({ scope: "local" })).error).toBeNull();
    await users.logout(actorOf(claims));
    expect((await client.auth.signOut({ scope: "local" })).error).toBeNull();
  });

  it("sign-out: admin local signOut revokes the Auth session", async () => {
    const { client, id, actor } = await aal2Admin("so");
    const token = (await client.auth.getSession()).data.session!.access_token;
    expect((await fresh().auth.getUser(token)).error).toBeNull();
    await makeUsers(client).logout(actor);
    expect((await client.auth.signOut({ scope: "local" })).error).toBeNull();
    const after = await fresh().auth.getUser(token);
    expect(after.error).not.toBeNull();
    expect(id).toBeTruthy();
    expect((await client.auth.signOut({ scope: "local" })).error).toBeNull();
  });

  it("Review Focus 2: no PIN in audit_log, auth_events or console output", async () => {
    const audit = JSON.stringify((await admin.from("audit_log").select("*").eq("company_id", companyId)).data);
    const events = JSON.stringify((await admin.from("auth_events").select("*").in("user_id", operatorIds)).data);
    expect(pins.length).toBeGreaterThan(3);
    const all = output.join("\n");
    for (const pin of pins) {
      expect(audit).not.toContain(`"${pin}"`);
      expect(audit).not.toMatch(new RegExp(`\\b${pin}\\b`));
      expect(events).not.toMatch(new RegExp(`\\b${pin}\\b`));
      expect(all).not.toMatch(new RegExp(`\\b${pin}\\b`));
    }
  });
});
