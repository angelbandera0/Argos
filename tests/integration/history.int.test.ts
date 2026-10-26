import { createHmac, randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Actor } from "@/core/domain/actor";
import { createAdminClient } from "@/infrastructure/supabase/admin-client";
import { makeAuthGateway, makeMfaGateway } from "@/infrastructure/supabase/auth-gateway";
import { makeCatalog } from "@/infrastructure/supabase/catalog-factory";
import { makeHistory } from "@/infrastructure/supabase/history-factory";
import { makeHistoryReader } from "@/infrastructure/supabase/history-reader";
import { readClaims } from "@/infrastructure/supabase/claims";
import { makeCompanyRepository } from "@/infrastructure/supabase/company-repository";
import { enterWithPinFlow } from "@/infrastructure/supabase/pin-login";
import { makeRoleRepository } from "@/infrastructure/supabase/role-repository";
import { makeSiteRepository } from "@/infrastructure/supabase/site-repository";
import { makeStoreRepository } from "@/infrastructure/supabase/store-repository";
import { makeUsers } from "@/infrastructure/supabase/users-factory";

const admin = createAdminClient();
const gateway = makeAuthGateway(admin);
const run = randomBytes(3).toString("hex");
const adminIds: string[] = [];
const operatorIds: string[] = [];
const companyIds: string[] = [];

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
  const email = `itest-t32-${run}-${tag}@example.com`;
  const created = await gateway.createAdminUser({ email, displayName: `itest t32 ${tag}` });
  adminIds.push(created.userId);
  const client = fresh();
  expect((await client.auth.signInWithPassword({ email, password: created.temporaryPassword })).error).toBeNull();
  const mfa = makeMfaGateway(client);
  const { factorId, secret } = await mfa.enrollTotp();
  await mfa.verifyTotp({ code: totp(secret), factorId });
  return { id: created.userId, client, actor: { userId: created.userId, kind: "admin", channel: "ui" } };
}

type Perms = { view: boolean; create: boolean; edit: boolean; delete: boolean };

let a: Awaited<ReturnType<typeof aal2Admin>>;
let b: Awaited<ReturnType<typeof aal2Admin>>;
let companyA: string;
let companyB: string;
let storeA: string;
let categoryId: string;
let productId: string;

async function operator(tag: string, products: Perms) {
  const role = await makeRoleRepository(a.client).create({
    ownerId: a.id,
    name: `itest-t32-${run} ${tag}`,
    sessionSeconds: null,
    excludedCompanyIds: [],
    permissions: { products },
  });
  const created = await makeUsers(a.client).createOperator(a.actor, {
    companyId: companyA,
    name: `itest${run}${tag}`,
    displayName: `itest t32 ${tag}`,
    roleId: role.id,
    storeIds: [storeA],
  });
  operatorIds.push(created.userId);
  const client = fresh();
  expect(await enterWithPinFlow(client, { username: created.username, pin: created.pin })).not.toBeNull();
  const claims = (await readClaims(client))!;
  const actor: Actor = { userId: claims.userId, kind: "operator", channel: "ui", sessionId: claims.sessionId! };
  await makeUsers(client).chooseStore(actor, { storeId: storeA });
  return { actor, client, catalog: makeCatalog(client) };
}

beforeAll(async () => {
  a = await aal2Admin("a");
  b = await aal2Admin("b");
  const ca = await makeCompanyRepository(a.client).create({ name: `itest-t32-${run}-a`, founderId: a.id });
  companyIds.push(ca.id);
  companyA = ca.id;
  const cb = await makeCompanyRepository(b.client).create({ name: `itest-t32-${run}-b`, founderId: b.id });
  companyIds.push(cb.id);
  companyB = cb.id;
  const site = await makeSiteRepository(a.client).create({ companyId: companyA, name: `itest-t32-${run} sede` });
  storeA = (await makeStoreRepository(a.client).create({ companyId: companyA, siteId: site.id, name: "Tienda A" })).id;
});

afterAll(async () => {
  await admin.from("app_sessions").delete().in("user_id", operatorIds);
  await admin.from("auth_events").delete().in("user_id", [...operatorIds, ...adminIds]);
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
  expect((await admin.from("companies").select("id").like("name", `itest-t32-${run}%`)).data).toEqual([]);
  expect((await admin.from("profiles").select("id").like("username", `%.itest${run}%`)).data).toEqual([]);
  expect((await admin.from("roles").select("id").like("name", `itest-t32-${run}%`)).data).toEqual([]);
  expect((await admin.from("auth_events").select("id").in("user_id", [...operatorIds, ...adminIds])).data).toEqual([]);
  expect((await admin.from("categories").select("id").in("company_id", companyIds)).data).toEqual([]);
  expect((await admin.from("products").select("id").in("company_id", companyIds)).data).toEqual([]);
  const users = await admin.auth.admin.listUsers({ perPage: 200 });
  expect(users.data.users.filter((u) => u.email?.includes(`t32-${run}`) || u.email?.includes(`.itest${run}`))).toEqual([]);
});

describe("history (REQ-009)", () => {
  it("create + edit by an operator leave two entries visible to the admin, with before/after, actor, store and channel", async () => {
    const adminCatalog = makeCatalog(a.client);
    categoryId = (await adminCatalog.createCategory(a.actor, { companyId: companyA, name: "Bebidas" })).id;
    const op = await operator("w", { view: true, create: true, edit: true, delete: false });
    const p = await op.catalog.createProduct(op.actor, { name: "Pan", categoryId });
    productId = p.id;
    await op.catalog.updateProduct(op.actor, { id: p.id, name: "Pan 2" });

    const page = await makeHistory(a.client).listHistory(a.actor, { companyId: companyA, module: "products" });
    const rows = page.items.filter((e) => e.entityType === "products" && e.entityId === p.id);
    expect(rows.map((e) => e.action)).toEqual(["update", "create"]);
    const [upd, crt] = rows;
    expect(crt).toMatchObject({ actorId: op.actor.userId, storeId: storeA, channel: "ui", before: null });
    expect(crt.after).toMatchObject({ name: "Pan" });
    expect(upd).toMatchObject({ actorId: op.actor.userId, storeId: storeA, channel: "ui" });
    expect(upd.before).toMatchObject({ name: "Pan" });
    expect(upd.after).toMatchObject({ name: "Pan 2" });
    expect(JSON.stringify(page.items)).not.toMatch(/"(pin|password|credential)[a-z_]*"/i);
    const byUser = await makeHistory(a.client).listHistory(a.actor, { companyId: companyA, actorId: op.actor.userId });
    expect(byUser.items.every((e) => e.actorId === op.actor.userId)).toBe(true);
  });

  it("operator without view gets Forbidden; with view sees only that module; another company's admin sees nothing", async () => {
    const none = await operator("n", { view: false, create: false, edit: false, delete: false });
    await expect(makeHistory(none.client).listHistory(none.actor, { module: "products" })).rejects.toMatchObject({ name: "Forbidden" });
    expect((await none.client.from("audit_log").select("id")).data).toEqual([]);
    const viewer = await operator("v", { view: true, create: false, edit: false, delete: false });
    const mine = await makeHistory(viewer.client).listHistory(viewer.actor, { module: "products" });
    expect(mine.items.length).toBeGreaterThanOrEqual(2);
    expect(mine.items.every((e) => e.module === "products")).toBe(true);
    await expect(makeHistory(b.client).listHistory(b.actor, { companyId: companyA })).rejects.toMatchObject({ name: "Forbidden" });
    const own = await makeHistory(b.client).listHistory(b.actor, { companyId: companyB });
    expect(own.items.every((e) => e.entityId !== productId)).toBe(true);
    const direct = await makeHistoryReader(b.client).list({ companyId: companyA });
    expect(direct.items).toEqual([]);
  });

  it("cursor pagination returns everything once, newest first", async () => {
    const reader = makeHistoryReader(a.client);
    const all = await reader.list({ companyId: companyA, limit: 100 });
    expect(all.nextCursor).toBeNull();
    expect(all.items.length).toBeGreaterThanOrEqual(4);
    const seen: string[] = [];
    let cursor: string | undefined;
    let pages = 0;
    do {
      const page = await reader.list({ companyId: companyA, limit: 2, cursor });
      seen.push(...page.items.map((e) => e.id));
      cursor = page.nextCursor ?? undefined;
      pages++;
    } while (cursor);
    expect(seen).toEqual(all.items.map((e) => e.id));
    expect(new Set(seen).size).toBe(seen.length);
    expect(pages).toBeGreaterThan(1);
    await expect(reader.list({ companyId: companyA, cursor: "garbage" })).rejects.toThrow();
  });

  it("auth_events are for administrators only", async () => {
    const op = await operator("e", { view: true, create: false, edit: false, delete: false });
    await admin.from("auth_events").insert({ user_id: op.actor.userId, event: "login_ok", channel: "app" });
    const events = await makeHistory(a.client).listAuthEvents(a.actor, { companyId: companyA });
    expect(events.items.some((e) => e.userId === op.actor.userId && e.event === "login_ok")).toBe(true);
    await expect(makeHistory(op.client).listAuthEvents(op.actor, {})).rejects.toMatchObject({ name: "Forbidden" });
    expect((await op.client.from("auth_events").select("id")).data).toEqual([]);
    await expect(makeHistory(b.client).listAuthEvents(b.actor, { companyId: companyA })).rejects.toMatchObject({ name: "Forbidden" });
    expect((await makeHistoryReader(b.client).listAuthEvents({ companyId: companyA })).items).toEqual([]);
  });
});
