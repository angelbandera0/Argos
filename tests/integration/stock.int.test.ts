import { createHmac, randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Actor } from "@/core/domain/actor";
import { createAdminClient } from "@/infrastructure/supabase/admin-client";
import { makeAuthGateway, makeMfaGateway } from "@/infrastructure/supabase/auth-gateway";
import { GET as listStockRoute } from "@/app/api/v1/stock/route";
import { GET as productStockRoute } from "@/app/api/v1/stock/products/[id]/route";
import { GET as movementsRoute } from "@/app/api/v1/stock/movements/route";
import * as costAdjustRoute from "@/app/api/v1/stock/lots/[id]/cost-adjustments/route";
import { POST as initialEntryRoute } from "@/app/api/v1/stock/entries/initial/route";
import { POST as transferRoute } from "@/app/api/v1/stock/transfers/route";
import { makeCatalogRepository } from "@/infrastructure/supabase/catalog-repository";
import { readClaims } from "@/infrastructure/supabase/claims";
import { makeCompanyRepository } from "@/infrastructure/supabase/company-repository";
import { makeCurrencies } from "@/infrastructure/supabase/currencies-factory";
import { enterWithPinFlow } from "@/infrastructure/supabase/pin-login";
import { makeRoleRepository } from "@/infrastructure/supabase/role-repository";
import { makeSiteRepository } from "@/infrastructure/supabase/site-repository";
import { makeStockRepository } from "@/infrastructure/supabase/stock-repository";
import { makeStock } from "@/infrastructure/supabase/stock-factory";
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
  const email = `itest-t14-${run}-${tag}@example.com`;
  const created = await gateway.createAdminUser({ email, displayName: `itest t14 ${tag}` });
  adminIds.push(created.userId);
  const client = fresh();
  expect((await client.auth.signInWithPassword({ email, password: created.temporaryPassword })).error).toBeNull();
  const mfa = makeMfaGateway(client);
  const { factorId, secret } = await mfa.enrollTotp();
  await mfa.verifyTotp({ code: totp(secret), factorId });
  return { id: created.userId, client, actor: { userId: created.userId, kind: "admin", channel: "ui" } };
}

let a: Awaited<ReturnType<typeof aal2Admin>>;
let b: Awaited<ReturnType<typeof aal2Admin>>;
let companyA: string;
let storeA: string;
let warehouse: string;
let store: string;
let productId: string;
let currencyId: string;
let warehouseLot: string;
let operator: { userId: string; username: string; pin: string };
let svc: ReturnType<typeof makeStock>;
let repo: ReturnType<typeof makeStockRepository>;

const stockOf = async (loc: string) => (await svc.getProductStock(a.actor, { productId, locationId: loc })).quantity;

beforeAll(async () => {
  a = await aal2Admin("a");
  b = await aal2Admin("b");
  companyA = (await makeCompanyRepository(a.client).create({ name: `itest-t14-${run}-a`, founderId: a.id })).id;
  companyIds.push(companyA);
  companyIds.push((await makeCompanyRepository(b.client).create({ name: `itest-t14-${run}-b`, founderId: b.id })).id);
  const site = await makeSiteRepository(a.client).create({ companyId: companyA, name: `itest-t14-${run} sede` });
  storeA = (await makeStoreRepository(a.client).create({ companyId: companyA, siteId: site.id, name: "Tienda A" })).id;
  const catalog = makeCatalogRepository(a.client);
  const cat = await catalog.createCategory({ companyId: companyA, name: "Granos" });
  productId = (await catalog.createProduct({ companyId: companyA, categoryId: cat.id, name: "Arroz", description: null, active: true })).id;
  currencyId = (await makeCurrencies(a.client).createCurrency(a.actor, { companyId: companyA, code: "MXN", name: "Peso", symbol: "$", decimals: 2, isDefault: true })).id;
  const role = await makeRoleRepository(a.client).create({
    ownerId: a.id,
    name: `itest-t14-${run} op`,
    sessionSeconds: null,
    excludedCompanyIds: [],
    permissions: {
      products: { view: true, create: false, edit: false, delete: false },
      stock: { view: true, create: false, edit: false, delete: false },
    },
  });
  operator = await makeUsers(a.client).createOperator(a.actor, {
    companyId: companyA,
    name: `itest${run}op`,
    displayName: "itest t14 op",
    roleId: role.id,
    storeIds: [storeA],
  });
  operatorIds.push(operator.userId);
  svc = makeStock(a.client);
  repo = makeStockRepository(a.client);
  const locs = await svc.listLocations(a.actor, { companyId: companyA });
  warehouse = locs.find((l) => l.kind === "warehouse")!.id;
  store = locs.find((l) => l.storeId === storeA)!.id;
});

afterAll(async () => {
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
  expect((await admin.from("companies").select("id").like("name", `itest-t14-${run}%`)).data).toEqual([]);
});

describe("stock repositories (REQ-020..)", { timeout: 120_000 }, () => {
  it("configures the product, enters stock with cost and transfers", async () => {
    await svc.saveProductStockConfig(a.actor, { productId, storable: true, baseUnit: "lb" });
    await svc.addPresentation(a.actor, { productId, name: "saco", content: 25 });
    await svc.addMovementUnit(a.actor, { productId, name: "porción", equivalence: 0.2 });
    expect(await svc.getProductStockConfig(a.actor, { productId })).toMatchObject({
      storable: true,
      baseUnit: "lb",
      presentations: [{ name: "saco", content: 25 }],
      movementUnits: [{ name: "porción", equivalence: 0.2 }],
    });

    warehouseLot = await svc.registerInitialEntry(a.actor, { productId, locationId: warehouse, qty: 5, unit: "saco", unitCost: 12, currencyId });
    const lot = await repo.getLot(warehouseLot);
    expect(lot).toMatchObject({ initialQty: 125, remaining: 125, capturedQty: 5, capturedUnit: "saco", content: 25, origin: "initial_entry" });
    expect(lot!.unitCost).toEqual({ amount: 12, currencyId });

    const t = await svc.transferStock(a.actor, { productId, fromLocationId: warehouse, toLocationId: store, qty: 10, unit: "porción" });
    expect(t.movedBase).toBe(2);
    expect(await stockOf(warehouse)).toBe(123);
    expect(await stockOf(store)).toBe(2);
    const dest = await repo.getLot(t.lots[0].destLot);
    expect(dest).toMatchObject({ locationId: store, sourceLotId: warehouseLot, remaining: 2 });
    expect(dest!.unitCost).toEqual({ amount: 12, currencyId });

    const moves = await svc.listMovements(a.actor, { companyId: companyA, productId });
    expect(moves.total).toBe(3);
    expect(moves.items.map((m) => m.type).sort()).toEqual(["initial_entry", "transfer_in", "transfer_out"]);
    expect(moves.items[0].unitCost).toEqual({ amount: 12, currencyId });
  });

  it("writes off, adjusts and registers surplus", async () => {
    const reasons = await svc.listWriteOffReasons(a.actor, { companyId: companyA });
    const other = reasons.find((r) => r.requiresText)!;
    const standard = reasons.find((r) => r.standard && !r.requiresText)!;
    await expect(svc.writeOffStock(a.actor, { productId, locationId: warehouse, qty: 1, unit: "base", reasonId: other.id })).rejects.toMatchObject({ code: "REASON_TEXT_REQUIRED" });
    await svc.writeOffStock(a.actor, { productId, locationId: warehouse, qty: 1, unit: "base", reasonId: standard.id });
    expect(await stockOf(warehouse)).toBe(122);
    await svc.writeOffStock(a.actor, { productId, locationId: warehouse, qty: 1, unit: "base", reasonId: other.id, reasonText: "derrame" });
    expect(await stockOf(warehouse)).toBe(121);

    await svc.adjustLot(a.actor, { lotId: warehouseLot, delta: -1, reasonText: "conteo" });
    expect(await stockOf(warehouse)).toBe(120);
    const surplus = await svc.registerSurplus(a.actor, { productId, locationId: warehouse, qty: 3, reasonText: "conteo" });
    expect(await stockOf(warehouse)).toBe(123);
    expect((await repo.getLot(surplus))!.unitCost).toBeNull();
  });

  it("derives status from the minimum and notifies the administrator", async () => {
    await svc.setMinimum(a.actor, { productId, locationId: store, minimum: 5 });
    expect(await repo.getStockLine(productId, store)).toMatchObject({ quantity: 2, minimum: 5, status: "low", productName: "Arroz", categoryName: "Granos", baseUnit: "lb" });
    await svc.writeOffStock(a.actor, {
      productId,
      locationId: store,
      qty: 2,
      unit: "base",
      reasonId: (await svc.listWriteOffReasons(a.actor, { companyId: companyA })).find((r) => r.standard && !r.requiresText)!.id,
    });
    const list = await svc.listStockStatus(a.actor, { companyId: companyA, locationId: store });
    expect(list.items[0]).toMatchObject({ status: "out", quantity: 0 });
    expect(list.counts).toEqual({ normal: 0, low: 0, out: 1 });
    expect((await svc.listStockStatus(a.actor, { companyId: companyA, locationId: store, q: "zzz" })).total).toBe(0);
    expect((await svc.listStockStatus(a.actor, { companyId: companyA, locationId: store, q: "arr", status: "out" })).total).toBe(1);

    const notes = await admin.from("notifications").select("operation").eq("recipient_id", operator.userId).eq("module", "stock");
    expect(notes.data?.map((n) => n.operation)).toContain("out_of_stock");

    await svc.clearMinimum(a.actor, { productId, locationId: store });
    expect((await repo.getStockLine(productId, store))!.minimum).toBe(0);
  });

  it("manages write-off reasons", async () => {
    const r = await svc.createWriteOffReason(a.actor, { companyId: companyA, code: "itest_mold", name: "Moho" });
    await svc.renameWriteOffReason(a.actor, { id: r.id, name: "Moho visible" });
    await svc.setWriteOffReasonActive(a.actor, { id: r.id, active: false });
    expect((await svc.listWriteOffReasons(a.actor, { companyId: companyA })).find((x) => x.id === r.id)).toMatchObject({ name: "Moho visible", active: false, standard: false, requiresText: false });
    await svc.deleteWriteOffReason(a.actor, { id: r.id });
    expect((await svc.listWriteOffReasons(a.actor, { companyId: companyA })).some((x) => x.id === r.id)).toBe(false);
  });

  it("hides costs from an operator without see_costs", async () => {
    const client = fresh();
    expect(await enterWithPinFlow(client, { username: operator.username, pin: operator.pin })).not.toBeNull();
    const claims = (await readClaims(client))!;
    const actor: Actor = { userId: claims.userId, kind: "operator", channel: "ui", sessionId: claims.sessionId! };
    await makeUsers(client).chooseStore(actor, { storeId: storeA });

    const lots = await makeStockRepository(client).listLots(productId, store, { onlyAvailable: false });
    expect(lots).toHaveLength(1);
    expect(lots[0].unitCost).toBeUndefined();
    const opSvc = makeStock(client);
    const moves = await opSvc.listMovements(actor, { productId });
    expect(moves.items.length).toBeGreaterThan(0);
    expect(moves.items.every((m) => m.locationId === store && m.unitCost === undefined)).toBe(true);
    expect((await opSvc.getProductStock(actor, { productId, locationId: store, onlyAvailable: false })).lots.every((l) => l.unitCost === undefined)).toBe(true);
    expect((await makeStockRepository(client).listLots(productId, warehouse, { onlyAvailable: false })).every((l) => l.unitCost === undefined)).toBe(true);
  });

  it("another company sees nothing", async () => {
    const other = makeStock(b.client);
    expect(await makeStockRepository(b.client).listLots(productId, warehouse, { onlyAvailable: false })).toEqual([]);
    expect(await makeStockRepository(b.client).getProductCompany(productId)).toBeNull();
    await expect(other.getProductStock(b.actor, { productId, locationId: warehouse })).rejects.toMatchObject({ name: "NotFound" });
  });

  describe("operator with only stock view (no products view, no see_costs)", () => {
    let client: SupabaseClient;
    let actor: Actor;

    beforeAll(async () => {
      const role = await makeRoleRepository(a.client).create({
        ownerId: a.id,
        name: `itest-t14-${run} stock-only`,
        sessionSeconds: null,
        excludedCompanyIds: [],
        permissions: { stock: { view: true, create: false, edit: false, delete: false } },
      });
      const op = await makeUsers(a.client).createOperator(a.actor, {
        companyId: companyA,
        name: `itest${run}so`,
        displayName: "itest t14 stock only",
        roleId: role.id,
        storeIds: [storeA],
      });
      operatorIds.push(op.userId);
      client = fresh();
      expect(await enterWithPinFlow(client, { username: op.username, pin: op.pin })).not.toBeNull();
      const claims = (await readClaims(client))!;
      actor = { userId: claims.userId, kind: "operator", channel: "ui", sessionId: claims.sessionId! };
      await makeUsers(client).chooseStore(actor, { storeId: storeA });
    });

    it("lists the store's stock with product names", async () => {
      const list = await makeStock(client).listStockStatus(actor, { locationId: store });
      expect(list.items.length).toBeGreaterThan(0);
      expect(list.items[0]).toMatchObject({ productId, productName: "Arroz", categoryName: "Granos" });
    });

    it("serves stock over the REST handlers; costs are shown to the admin and absent for the operator", async () => {
      await admin.auth.admin.updateUserById(a.id, { app_metadata: { must_change_password: false } });
      expect((await a.client.auth.refreshSession()).error).toBeNull();
      const token = async (c: SupabaseClient) => (await c.auth.getSession()).data.session!.access_token;
      const call = async (handler: (r: Request, c: unknown) => Promise<Response>, c: SupabaseClient, path: string, json?: unknown, ctx: object = {}) => {
        const res = await handler(
          new Request(`http://x/api/v1${path}`, {
            method: json === undefined ? "GET" : "POST",
            headers: { authorization: `Bearer ${await token(c)}`, "content-type": "application/json" },
            ...(json !== undefined && { body: JSON.stringify(json) }),
          }),
          { params: Promise.resolve(ctx) },
        );
        return { status: res.status, json: await res.json().catch(() => null) };
      };
      const entry = await call(initialEntryRoute, a.client, "/stock/entries/initial", { productId, locationId: warehouse, qty: 4, unit: "base", unitCost: 7, currencyId });
      expect(entry.status).toBe(201);
      const moved = await call(transferRoute, a.client, "/stock/transfers", { productId, fromLocationId: warehouse, toLocationId: store, qty: 1, unit: "base" });
      expect(moved.status).toBe(201);

      const adminList = await call(listStockRoute, a.client, `/stock?companyId=${companyA}&locationId=${store}&q=arr`);
      expect(adminList.status).toBe(200);
      expect(adminList.json.items[0]).toMatchObject({ productName: "Arroz", quantity: 1 });
      const adminDetail = await call(productStockRoute, a.client, `/stock/products/${productId}?locationId=${warehouse}`, undefined, { id: productId });
      expect(adminDetail.json.lots.some((l: Record<string, unknown>) => "unitCost" in l)).toBe(true);
      const adminMoves = await call(movementsRoute, a.client, `/stock/movements?companyId=${companyA}&productId=${productId}`);
      expect(adminMoves.json.items.some((m: Record<string, unknown>) => "unitCost" in m)).toBe(true);
      const costRoute = { POST: costAdjustRoute.POST, GET: costAdjustRoute.GET };
      const ctxLot = { id: warehouseLot };
      const fix = await call(costRoute.POST, a.client, `/stock/lots/${warehouseLot}/cost-adjustments`, { newUnitCost: 15, reason: "error de compra" }, ctxLot);
      expect(fix.status).toBe(201);
      const bad = await call(costRoute.POST, a.client, `/stock/lots/${warehouseLot}/cost-adjustments`, { newUnitCost: -1, reason: "error de compra" }, ctxLot);
      expect(bad.status).toBe(422);
      const listed = await call(costRoute.GET, a.client, `/stock/lots/${warehouseLot}/cost-adjustments`, undefined, ctxLot);
      expect(listed.json.items[0]).toMatchObject({ oldUnitCost: 12, newUnitCost: 15, reason: "error de compra" });
      const denied = await call(costRoute.POST, client, `/stock/lots/${warehouseLot}/cost-adjustments`, { newUnitCost: 20, reason: "sin permiso" }, ctxLot);
      expect(denied.status).toBe(403);
      const opSvc = makeStock(client);
      const opDetail = await opSvc.getProductStock(actor, { productId, locationId: store, onlyAvailable: false });
      expect(opDetail.lots.every((l) => !("unitCost" in l))).toBe(true);
      expect((await opSvc.listMovements(actor, { productId })).items.every((m) => !("unitCost" in m))).toBe(true);
    });
  });
});
