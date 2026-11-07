import { createHmac, randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Actor } from "@/core/domain/actor";
import { createAdminClient } from "@/infrastructure/supabase/admin-client";
import { makeAuthGateway, makeMfaGateway } from "@/infrastructure/supabase/auth-gateway";
import { makeCatalogRepository } from "@/infrastructure/supabase/catalog-repository";
import { readClaims } from "@/infrastructure/supabase/claims";
import { makeCompanyRepository } from "@/infrastructure/supabase/company-repository";
import { makeCurrencies } from "@/infrastructure/supabase/currencies-factory";
import { enterWithPinFlow } from "@/infrastructure/supabase/pin-login";
import { makeRoleRepository } from "@/infrastructure/supabase/role-repository";
import { makeSiteRepository } from "@/infrastructure/supabase/site-repository";
import { makeStock } from "@/infrastructure/supabase/stock-factory";
import { makeStoreRepository } from "@/infrastructure/supabase/store-repository";
import { makeUsers } from "@/infrastructure/supabase/users-factory";
import { makeRequests } from "@/infrastructure/supabase/request-factory";
import { makeOrders } from "@/infrastructure/supabase/order-factory";
import { GET as orderRoute } from "@/app/api/v1/pedidos/[id]/route";
import { GET as bagRoute } from "@/app/api/v1/solicitudes/bag/route";

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
  const email = `itest-t22-${run}-${tag}@example.com`;
  const created = await gateway.createAdminUser({ email, displayName: `itest t22 ${tag}` });
  adminIds.push(created.userId);
  const client = fresh();
  expect((await client.auth.signInWithPassword({ email, password: created.temporaryPassword })).error).toBeNull();
  const mfa = makeMfaGateway(client);
  const { factorId, secret } = await mfa.enrollTotp();
  await mfa.verifyTotp({ code: totp(secret), factorId });
  return { id: created.userId, client, actor: { userId: created.userId, kind: "admin", channel: "ui" } };
}


type Op = { client: SupabaseClient; actor: Actor; userId: string };
let a: Awaited<ReturnType<typeof aal2Admin>>;
let b: Awaited<ReturnType<typeof aal2Admin>>;
let companyA: string;
let storeA: string;
let warehouse: string;
let productId: string;
let currencyId: string;
let storeOp: Op;
let buyer: Op;
let roleSeq = 0;

const view = { view: true, create: true, edit: true, delete: false };

async function operator(tag: string, specials: { permission: string; warehouse: boolean }[]): Promise<Op> {
  const role = await makeRoleRepository(a.client).create({
    ownerId: a.id,
    name: `itest-t22-${run} ${tag}`,
    sessionSeconds: null,
    excludedCompanyIds: [],
    permissions: { stock: view, requests: view, orders: view },
    specialPermissions: specials as never,
  });
  const op = await makeUsers(a.client).createOperator(a.actor, {
    companyId: companyA,
    name: `itest${run}${tag}${roleSeq++}`,
    displayName: `itest t22 ${tag}`,
    roleId: role.id,
    storeIds: [storeA],
  });
  operatorIds.push(op.userId);
  const client = fresh();
  expect(await enterWithPinFlow(client, { username: op.username, pin: op.pin })).not.toBeNull();
  const claims = (await readClaims(client))!;
  const actor: Actor = { userId: claims.userId, kind: "operator", channel: "ui", sessionId: claims.sessionId! };
  await makeUsers(client).chooseStore(actor, { storeId: storeA });
  return { client, actor, userId: op.userId };
}

beforeAll(async () => {
  a = await aal2Admin("a");
  b = await aal2Admin("b");
  companyA = (await makeCompanyRepository(a.client).create({ name: `itest-t22-${run}-a`, founderId: a.id })).id;
  companyIds.push(companyA);
  companyIds.push((await makeCompanyRepository(b.client).create({ name: `itest-t22-${run}-b`, founderId: b.id })).id);
  const site = await makeSiteRepository(a.client).create({ companyId: companyA, name: `itest-t22-${run} sede` });
  storeA = (await makeStoreRepository(a.client).create({ companyId: companyA, siteId: site.id, name: "Tienda A" })).id;
  const catalog = makeCatalogRepository(a.client);
  const cat = await catalog.createCategory({ companyId: companyA, name: "Granos" });
  productId = (await catalog.createProduct({ companyId: companyA, categoryId: cat.id, name: "Arroz", description: null, active: true })).id;
  const stock = makeStock(a.client);
  await stock.saveProductStockConfig(a.actor, { productId, storable: true, baseUnit: "lb" });
  warehouse = (await stock.listLocations(a.actor, { companyId: companyA })).find((l) => l.kind === "warehouse")!.id;
  currencyId = (await makeCurrencies(a.client).createCurrency(a.actor, { companyId: companyA, code: "MXN", name: "Peso", symbol: "$", decimals: 2, isDefault: true })).id;
  await stock.registerInitialEntry(a.actor, { productId, locationId: warehouse, qty: 10, unit: "base" });
  storeOp = await operator("tienda", [{ permission: "request_replenishment", warehouse: false }]);
  buyer = await operator("comprador", [
    { permission: "make_purchases", warehouse: false },
    { permission: "review_orders", warehouse: true },
  ]);
  await admin.auth.admin.updateUserById(a.id, { app_metadata: { must_change_password: false } });
  expect((await a.client.auth.refreshSession()).error).toBeNull();
});

afterAll(async () => {
  if (companyIds.length) {
    await admin.from("pedido_ajustes").update({ created_by: null }).in("company_id", companyIds);
    await admin.from("pedidos").update({ buyer_id: null, created_by: null, confirmed_by: null }).in("company_id", companyIds);
    await admin.from("solicitudes").update({ created_by: null }).in("company_id", companyIds);
    await admin.from("solicitud_asignaciones").update({ decided_by: null }).in("company_id", companyIds);
  }
  await admin.from("app_sessions").delete().in("user_id", operatorIds);
  if (companyIds.length) await admin.from("user_stores").delete().in("company_id", companyIds);
  for (const id of operatorIds) await admin.auth.admin.deleteUser(id);
  const rids = adminIds.length ? ((await admin.from("roles").select("id").in("owner_id", adminIds)).data ?? []).map((r) => r.id) : [];
  if (rids.length) {
    await admin.from("role_company_exclusions").delete().in("role_id", rids);
    await admin.from("role_special_permissions").delete().in("role_id", rids);
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
  expect((await admin.from("companies").select("id").like("name", `itest-t22-${run}%`)).data).toEqual([]);
});

describe("replenishment repositories and API", { timeout: 180_000 }, () => {
  it("runs request -> bag -> order -> purchase -> review -> confirm with lots", async () => {
    const reqs = makeRequests(a.client);
    const orders = makeOrders(a.client);
    const stockSvc = makeStock(a.client);

    const requestId = await makeRequests(storeOp.client).createRequest(storeOp.actor, { storeId: storeA, lines: [{ productId, qty: 10, unit: "base" }] });
    const detail = await reqs.getRequest(a.actor, { companyId: companyA, requestId });
    expect(detail).toMatchObject({ status: "new", storeName: "Tienda A", lineCount: 1 });
    const lineId = detail.lines[0].id;
    expect((await reqs.listRequests(a.actor, { companyId: companyA, status: "new" })).total).toBe(1);
    expect((await makeRequests(storeOp.client).listRequests(storeOp.actor, {})).total).toBe(1);

    await reqs.attendRequestLine(a.actor, { companyId: companyA, lineId, kind: "fulfilled", qtyBase: 4 });
    const toBuy = await reqs.attendRequestLine(a.actor, { companyId: companyA, lineId, kind: "to_buy", qtyBase: 6 });
    expect((await reqs.getRequest(a.actor, { companyId: companyA, requestId })).status).toBe("to_buy");
    expect(await reqs.listPurchaseBag(a.actor, { companyId: companyA })).toEqual([
      expect.objectContaining({ productId, productName: "Arroz", storeId: storeA, qtyBase: 6, decisions: 1 }),
    ]);

    const line = { productId, dest: "warehouse" as const, qty: 6, unit: "base", content: 1, assignmentId: toBuy };
    const orderId = await orders.createOrder(a.actor, { companyId: companyA, currencyId, lines: [line] });
    expect(await reqs.listPurchaseBag(a.actor, { companyId: companyA })).toEqual([]);
    await expect(orders.createOrder(a.actor, { companyId: companyA, lines: [line] })).rejects.toMatchObject({ code: "ASSIGNMENT_ALREADY_ORDERED" });

    await expect(orders.assignBuyer(a.actor, { companyId: companyA, orderId, buyerId: storeOp.userId })).rejects.toMatchObject({ code: "BUYER_NOT_ELIGIBLE" });
    await orders.assignBuyer(a.actor, { companyId: companyA, orderId, buyerId: buyer.userId });

    const buyerOrders = makeOrders(buyer.client);
    const orderLine = (await buyerOrders.getOrder(buyer.actor, { orderId })).lines[0];
    await buyerOrders.registerPurchase(buyer.actor, { orderId, lines: [{ lineId: orderLine.id, qtyBought: 5, unitCost: 3 }], amountGiven: 20 });
    expect(await buyerOrders.submitReview(buyer.actor, { orderId })).toEqual({ given: 20, spent: 15, leftover: 5 });
    await expect(buyerOrders.saveReview(buyer.actor, { orderId, lines: [{ lineId: orderLine.id, qtyReceived: 4 }] })).rejects.toMatchObject({ code: "BUYER_CANNOT_REVIEW" });

    const token = async (c: SupabaseClient) => (await c.auth.getSession()).data.session!.access_token;
    const rest = async (c: SupabaseClient, path: string, handler: (r: Request, c: unknown) => Promise<Response>, ctx: object = {}) => {
      const res = await handler(new Request(`http://x/api/v1${path}`, { headers: { authorization: `Bearer ${await token(c)}` } }), { params: Promise.resolve(ctx) });
      return { status: res.status, json: await res.json() };
    };
    const asBuyer = await buyerOrders.getOrder(buyer.actor, { orderId });
    expect(asBuyer.lines[0]).not.toHaveProperty("unitCost");
    expect(asBuyer).not.toHaveProperty("spent");
    const asAdmin = await rest(a.client, `/pedidos/${orderId}?companyId=${companyA}`, orderRoute, { id: orderId });
    expect(asAdmin.json.lines[0].unitCost).toBe(3);
    expect(asAdmin.json).toMatchObject({ status: "in_review", amountGiven: 20, spent: 15, leftover: 5 });
    const bag = await rest(a.client, `/solicitudes/bag?companyId=${companyA}`, bagRoute);
    expect(bag.json.items).toEqual([]);

    await orders.saveReview(a.actor, { companyId: companyA, orderId, lines: [{ lineId: orderLine.id, qtyReceived: 4 }] });
    await orders.confirmOrder(a.actor, { companyId: companyA, orderId });
    const done = await orders.getOrder(a.actor, { companyId: companyA, orderId });
    expect(done).toMatchObject({ status: "fulfilled", shortageValue: 3 });
    expect(done.lines[0]).toMatchObject({ qtyReceived: 4, unitCost: 3 });
    expect((await admin.from("pedido_lotes").select("lot_id").eq("order_id", orderId)).data).toHaveLength(1);
    expect((await stockSvc.getProductStock(a.actor, { productId, locationId: warehouse })).quantity).toBe(10);
    expect((await orders.listOrders(a.actor, { companyId: companyA, status: "fulfilled" })).total).toBe(1);
  });

  it("another company sees nothing", async () => {
    await expect(makeOrders(b.client).listOrders(b.actor, { companyId: companyA })).rejects.toBeDefined();
    expect((await makeRequests(b.client).listRequests(b.actor, {}).catch(() => ({ total: 0 }))).total).toBe(0);
  });
});
