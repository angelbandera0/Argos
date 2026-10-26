import { createHmac, randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Actor } from "@/core/domain/actor";
import type { Product } from "@/core/application/ports/catalog-repository";
import { createAdminClient } from "@/infrastructure/supabase/admin-client";
import { makeAuthGateway, makeMfaGateway } from "@/infrastructure/supabase/auth-gateway";
import { makeCatalog } from "@/infrastructure/supabase/catalog-factory";
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
  const email = `itest-t30-${run}-${tag}@example.com`;
  const created = await gateway.createAdminUser({ email, displayName: `itest t30 ${tag}` });
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

async function operator(tag: string, products: Perms) {
  const role = await makeRoleRepository(a.client).create({
    ownerId: a.id,
    name: `itest-t30-${run} ${tag}`,
    sessionSeconds: null,
    excludedCompanyIds: [],
    permissions: { products },
  });
  const created = await makeUsers(a.client).createOperator(a.actor, {
    companyId: companyA,
    name: `itest${run}${tag}`,
    displayName: `itest t30 ${tag}`,
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
  const ca = await makeCompanyRepository(a.client).create({ name: `itest-t30-${run}-a`, founderId: a.id });
  companyIds.push(ca.id);
  companyA = ca.id;
  const cb = await makeCompanyRepository(b.client).create({ name: `itest-t30-${run}-b`, founderId: b.id });
  companyIds.push(cb.id);
  companyB = cb.id;
  const site = await makeSiteRepository(a.client).create({ companyId: companyA, name: `itest-t30-${run} sede` });
  storeA = (await makeStoreRepository(a.client).create({ companyId: companyA, siteId: site.id, name: "Tienda A" })).id;
});

afterAll(async () => {
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
  expect((await admin.from("companies").select("id").like("name", `itest-t30-${run}%`)).data).toEqual([]);
  expect((await admin.from("profiles").select("id").like("username", `%.itest${run}%`)).data).toEqual([]);
  expect((await admin.from("roles").select("id").like("name", `itest-t30-${run}%`)).data).toEqual([]);
  expect((await admin.from("categories").select("id").in("company_id", companyIds)).data).toEqual([]);
  expect((await admin.from("products").select("id").in("company_id", companyIds)).data).toEqual([]);
  const users = await admin.auth.admin.listUsers({ perPage: 200 });
  expect(users.data.users.filter((u) => u.email?.includes(`t30-${run}`) || u.email?.includes(`.itest${run}`))).toEqual([]);
});

describe("catalog repository (REQ-008)", () => {
  it("an admin creates a category and lists it; another company's admin sees nothing", async () => {
    const adminCatalog = makeCatalog(a.client);
    const cat = await adminCatalog.createCategory(a.actor, { companyId: companyA, name: "  Panadería  " });
    categoryId = cat.id;
    expect(cat.name).toBe("Panadería");
    expect(await adminCatalog.listCategories(a.actor, { companyId: companyA })).toEqual([cat]);
    expect(await makeCatalog(b.client).listCategories(b.actor, { companyId: companyB })).toEqual([]);
    await expect(makeCatalog(b.client).listCategories(b.actor, { companyId: companyA })).rejects.toMatchObject({ name: "Forbidden" });
    expect((await b.client.from("categories").select("id")).data).toEqual([]);
    await expect(adminCatalog.createCategory(a.actor, { companyId: companyA, name: " PANADERÍA" })).rejects.toMatchObject({ code: "NAME_TAKEN" });
  });

  it("an operator with create makes a product; without edit cannot edit; without delete cannot delete", async () => {
    const op = await operator("c", { view: true, create: true, edit: false, delete: false });
    const pan = await op.catalog.createProduct(op.actor, { name: "Pan", categoryId, description: "de sal" });
    expect(pan).toMatchObject({ companyId: companyA, categoryId, name: "Pan", description: "de sal", active: true });
    for (const name of ["pan", " pan ", "PAN"]) {
      await expect(op.catalog.createProduct(op.actor, { name, categoryId })).rejects.toMatchObject({ code: "NAME_TAKEN" });
    }
    await expect(op.catalog.updateProduct(op.actor, { id: pan.id, name: "Pan 2" })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(op.catalog.deleteProduct(op.actor, { id: pan.id })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(op.catalog.createCategory(op.actor, { name: "X" })).rejects.toMatchObject({ name: "Forbidden" });
    expect(await op.catalog.listProducts(op.actor)).toEqual([pan]);
    expect((await admin.from("products").select("name, deleted_at").eq("id", pan.id).single()).data).toEqual({ name: "Pan", deleted_at: null });
  });

  it("repository level: RLS blocks edit/delete for a create-only operator even when the use case is bypassed", async () => {
    const op = await operator("d", { view: true, create: true, edit: false, delete: false });
    const { makeCatalogRepository } = await import("@/infrastructure/supabase/catalog-repository");
    const repo = makeCatalogRepository(op.client);
    const [pan] = await repo.listProducts(companyA);
    await expect(repo.updateProduct(pan.id, { name: "Hack" })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(repo.setActive(pan.id, false)).rejects.toMatchObject({ name: "Forbidden" });
    await expect(repo.softDeleteProduct(pan.id)).rejects.toMatchObject({ name: "Forbidden" });
    expect((await repo.getProduct(pan.id))?.name).toBe("Pan");
  });

  it("without view the operator sees 0", async () => {
    const op = await operator("n", { view: false, create: false, edit: false, delete: false });
    expect((await op.client.from("products").select("id")).data).toEqual([]);
    expect((await op.client.from("categories").select("id")).data).toEqual([]);
    await expect(op.catalog.listProducts(op.actor)).rejects.toMatchObject({ name: "Forbidden" });
  });

  let live: Product;

  it("edit, deactivate, onlyActive, soft delete by an operator frees the name", async () => {
    const op = await operator("e", { view: true, create: true, edit: true, delete: true });
    const [pan] = await op.catalog.listProducts(op.actor);
    await op.catalog.updateProduct(op.actor, { id: pan.id, name: "Pan integral", description: null });
    await op.catalog.setProductActive(op.actor, { id: pan.id, active: false });
    const other = await op.catalog.createProduct(op.actor, { name: "Galleta", categoryId });
    expect((await op.catalog.listProducts(op.actor)).map((p) => p.name)).toEqual(["Galleta", "Pan integral"]);
    expect((await op.catalog.listProducts(op.actor, { onlyActive: true })).map((p) => p.name)).toEqual(["Galleta"]);

    await expect(op.catalog.deleteCategory(op.actor, { id: categoryId })).rejects.toMatchObject({ name: "Forbidden" });
    await op.catalog.deleteProduct(op.actor, { id: pan.id });
    expect((await op.catalog.listProducts(op.actor)).map((p) => p.name)).toEqual(["Galleta"]);
    expect((await admin.from("products").select("deleted_at").eq("id", pan.id).single()).data!.deleted_at).not.toBeNull();
    live = await op.catalog.createProduct(op.actor, { name: "pan integral", categoryId });
    expect(live.id).not.toBe(pan.id);
    expect(other.name).toBe("Galleta");
  });

  it("CATEGORY_HAS_PRODUCTS for live products; an admin deletes it once empty; deleted category rejects products", async () => {
    const adminCatalog = makeCatalog(a.client);
    await expect(adminCatalog.deleteCategory(a.actor, { id: categoryId })).rejects.toMatchObject({ code: "CATEGORY_HAS_PRODUCTS" });
    for (const p of await adminCatalog.listProducts(a.actor, { companyId: companyA })) {
      await adminCatalog.deleteProduct(a.actor, { id: p.id });
    }
    expect(await adminCatalog.listProducts(a.actor, { companyId: companyA })).toEqual([]);
    const extra = await adminCatalog.createCategory(a.actor, { companyId: companyA, name: "Otra" });
    await adminCatalog.deleteCategory(a.actor, { id: categoryId });
    expect((await adminCatalog.listCategories(a.actor, { companyId: companyA })).map((c) => c.id)).toEqual([extra.id]);
    const { makeCatalogRepository } = await import("@/infrastructure/supabase/catalog-repository");
    const repo = makeCatalogRepository(a.client);
    expect(await repo.getCategory(categoryId)).toBeNull();
    await expect(
      repo.createProduct({ companyId: companyA, categoryId, name: "Fantasma", description: null, active: true }),
    ).rejects.toMatchObject({ name: "NotFound" });
    expect(live.categoryId).toBe(categoryId);
  });
});
