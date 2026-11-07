import { afterEach, describe, expect, it, vi } from "vitest";
import { buildOpenApiDocument } from "@/app/api/v1/_lib/openapi";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { setContainerForTests } from "@/infrastructure/container";

vi.mock("@/infrastructure/env", () => ({
  getEnv: () => ({ NEXT_PUBLIC_SUPABASE_URL: "http://x", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "k" }),
}));

const claimsByToken: Record<string, Record<string, unknown> | undefined> = {
  superadmin: { sub: "s1", user_kind: "superadmin", aal: "aal2" },
  admin: { sub: "a1", user_kind: "admin", aal: "aal2" },
  operator: { sub: "o1", user_kind: "operator", aal: "aal1" },
  aal1admin: { sub: "a1", user_kind: "admin", aal: "aal1" },
  mustchange: { sub: "a1", user_kind: "admin", aal: "aal2", app_metadata: { must_change_password: true } },
};
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getClaims: async (t: string) => ({ data: { claims: claimsByToken[t] } }) } }),
}));

const routes = import.meta.glob("../../../app/api/v1/**/route.ts");
const load = async (p: string) => (await routes[`../../../app/api/v1/${p}/route.ts`]()) as Record<string, (r: Request, c: unknown) => Promise<Response>>;

let calls: { path: string; args: unknown[] }[] = [];
let allowed = "admin";
let result: unknown = { ok: true };
const deep = (path: string): unknown =>
  new Proxy(function () {}, {
    get: (_, k) => deep(path ? `${path}.${String(k)}` : String(k)),
    apply: async (_t, _this, args: unknown[]) => {
      calls.push({ path, args });
      if ((args[0] as { kind: string }).kind !== allowed) throw new Forbidden();
      return result;
    },
  });

afterEach(() => {
  calls = [];
  result = { ok: true };
});

type Row = [route: string, method: string, url: string, body: unknown, ctx: object, fake: string, kind: string, status: number];
const del = { reason: { code: "otro", text: "x" } };
const rows: Row[] = [
  ["admins", "GET", "/admins", undefined, {}, "listAdmins", "superadmin", 200],
  ["companies", "GET", "/companies", undefined, {}, "org.listCompanies", "admin", 200],
  ["companies", "POST", "/companies", { name: "A" }, {}, "org.createCompany", "admin", 201],
  ["companies/[id]", "PATCH", "/companies/c1", { name: "B" }, { id: "c1" }, "org.renameUnit", "admin", 204],
  ["companies/[id]", "POST", "/companies/c1:deactivate", del, { id: "c1:deactivate" }, "org.deactivateUnit", "admin", 204],
  ["companies/[id]", "POST", "/companies/c1:reactivate", { text: "t" }, { id: "c1:reactivate" }, "org.reactivateUnit", "admin", 204],
  ["companies/[id]/admins", "POST", "/companies/c1/admins", { adminId: "a2" }, { id: "c1" }, "org.grantAccess", "admin", 204],
  ["companies/[id]/admins/[adminId]", "DELETE", "/companies/c1/admins/a2", undefined, { id: "c1", adminId: "a2" }, "org.revokeAccess", "admin", 204],
  ["companies/[id]/settings", "PATCH", "/companies/c1/settings", { sessionCapSeconds: 60 }, { id: "c1" }, "org.updateSettings", "admin", 204],
  ["sites", "POST", "/sites", { companyId: "c1", name: "S" }, {}, "org.createSite", "admin", 201],
  ["sites/[ref]", "PATCH", "/sites/s1", { name: "S2" }, { ref: "s1" }, "org.renameUnit", "admin", 204],
  ["sites/[ref]", "POST", "/sites/s1:deactivate", del, { ref: "s1:deactivate" }, "org.deactivateUnit", "admin", 204],
  ["sites/[ref]", "POST", "/sites/s1:reactivate", { text: "t" }, { ref: "s1:reactivate" }, "org.reactivateUnit", "admin", 204],
  ["stores", "POST", "/stores", { companyId: "c1", siteId: "s1", name: "T" }, {}, "org.createStore", "admin", 201],
  ["stores/[ref]", "PATCH", "/stores/t1", { name: "T2" }, { ref: "t1" }, "org.renameUnit", "admin", 204],
  ["stores/[ref]", "POST", "/stores/t1:deactivate", del, { ref: "t1:deactivate" }, "org.deactivateUnit", "admin", 204],
  ["stores/[ref]", "POST", "/stores/t1:reactivate", { text: "t" }, { ref: "t1:reactivate" }, "org.reactivateUnit", "admin", 204],
  ["users", "POST", "/users", { companyId: "c1", name: "n", displayName: "N", roleId: "r1", storeIds: ["t1"] }, {}, "users.createOperator", "admin", 201],
  ["users/[id]", "POST", "/users/u1:reset-pin", undefined, { id: "u1:reset-pin" }, "users.resetPin", "admin", 200],
  ["users/[id]", "POST", "/users/u1:unlock", undefined, { id: "u1:unlock" }, "users.unlockUser", "admin", 200],
  ["users/[id]", "POST", "/users/u1:deactivate", undefined, { id: "u1:deactivate" }, "users.deactivateUser", "admin", 204],
  ["users/[id]/stores", "PUT", "/users/u1/stores", { assignments: [{ storeId: "t1", roleId: "r1" }] }, { id: "u1" }, "users.assignStores", "admin", 204],
  ["users/[id]/role", "PATCH", "/users/u1/role", { storeId: null, roleId: "r1" }, { id: "u1" }, "users.changeOperatorRole", "admin", 204],
  ["roles", "GET", "/roles", undefined, {}, "roles.listRoles", "admin", 200],
  ["roles", "POST", "/roles", { name: "R", permissions: { products: { view: true, create: false, edit: false, delete: false } } }, {}, "roles.createRole", "admin", 201],
  ["roles/[id]", "PATCH", "/roles/r1", { name: "R2" }, { id: "r1" }, "roles.updateRole", "admin", 200],
  ["roles/[id]", "DELETE", "/roles/r1", undefined, { id: "r1" }, "roles.deleteRole", "admin", 204],
  ["roles/[id]/exclusions", "PUT", "/roles/r1/exclusions", { companyIds: ["c1"] }, { id: "r1" }, "roles.setExclusions", "admin", 200],
  ["categories", "GET", "/categories?companyId=c1", undefined, {}, "catalog.listCategories", "admin", 200],
  ["categories", "POST", "/categories", { companyId: "c1", name: "C" }, {}, "catalog.createCategory", "admin", 201],
  ["categories/[id]", "PATCH", "/categories/k1", { name: "C2" }, { id: "k1" }, "catalog.renameCategory", "admin", 204],
  ["categories/[id]", "DELETE", "/categories/k1", undefined, { id: "k1" }, "catalog.deleteCategory", "admin", 204],
  ["products", "GET", "/products?companyId=c1", undefined, {}, "catalog.listProducts", "admin", 200],
  ["products", "POST", "/products", { companyId: "c1", name: "P", categoryId: "k1" }, {}, "catalog.createProduct", "admin", 201],
  ["products/[ref]", "PATCH", "/products/p1", { name: "P2" }, { ref: "p1" }, "catalog.updateProduct", "admin", 204],
  ["products/[ref]", "POST", "/products/p1:activate", undefined, { ref: "p1:activate" }, "catalog.setProductActive", "admin", 204],
  ["products/[ref]", "POST", "/products/p1:deactivate", undefined, { ref: "p1:deactivate" }, "catalog.setProductActive", "admin", 204],
  ["products/[ref]", "DELETE", "/products/p1", undefined, { ref: "p1" }, "catalog.deleteProduct", "admin", 204],
  ["currencies", "GET", "/currencies?companyId=c1&active=true&q=m", undefined, {}, "currencies.listCurrencies", "admin", 200],
  ["currencies", "POST", "/currencies", { companyId: "c1", code: "MXN", name: "Peso", symbol: "$", decimals: 2 }, {}, "currencies.createCurrency", "admin", 201],
  ["currencies/[id]", "GET", "/currencies/m1", undefined, { id: "m1" }, "currencies.getCurrency", "admin", 200],
  ["currencies/[id]", "PATCH", "/currencies/m1", { name: "Peso 2" }, { id: "m1" }, "currencies.updateCurrency", "admin", 204],
  ["currencies/[id]", "PATCH", "/currencies/m1", { active: false }, { id: "m1" }, "currencies.setCurrencyActive", "admin", 204],
  ["currencies/[id]", "DELETE", "/currencies/m1", undefined, { id: "m1" }, "currencies.deleteCurrency", "admin", 204],
  ["currencies/[id]/denominations", "GET", "/currencies/m1/denominations", undefined, { id: "m1" }, "currencies.listDenominations", "admin", 200],
  ["currencies/[id]/denominations", "POST", "/currencies/m1/denominations", { value: 5, kind: "coin" }, { id: "m1" }, "currencies.addDenomination", "admin", 201],
  ["currencies/[id]/denominations/[denominationId]", "PATCH", "/currencies/m1/denominations/d1", { value: 10 }, { id: "m1", denominationId: "d1" }, "currencies.updateDenomination", "admin", 204],
  ["currencies/[id]/denominations/[denominationId]", "PATCH", "/currencies/m1/denominations/d1", { active: false }, { id: "m1", denominationId: "d1" }, "currencies.setDenominationActive", "admin", 204],
  ["currencies/[id]/denominations/[denominationId]", "DELETE", "/currencies/m1/denominations/d1", undefined, { id: "m1", denominationId: "d1" }, "currencies.deleteDenomination", "admin", 204],
  ["notifications", "GET", "/notifications?module=stock&priority=urgent&read=unread&page=2&pageSize=10", undefined, {}, "notifications.listNotifications", "operator", 200],
  ["notifications/unread-count", "GET", "/notifications/unread-count", undefined, {}, "notifications.countUnreadNotifications", "admin", 200],
  ["notifications/read", "POST", "/notifications/read", { ids: ["3f1e2d4c-5b6a-4789-8abc-0123456789ab"] }, {}, "notifications.markNotificationsRead", "operator", 200],
  ["notifications/read", "POST", "/notifications/read", undefined, {}, "notifications.markNotificationsRead", "admin", 200],
  ["stock/locations", "GET", "/stock/locations?companyId=c1", undefined, {}, "stock.listLocations", "admin", 200],
  ["stock", "GET", "/stock?companyId=c1&locationId=l1&status=low&q=a&categoryId=k1&page=2&pageSize=10", undefined, {}, "stock.listStockStatus", "admin", 200],
  ["stock/products/[id]", "GET", "/stock/products/p1?locationId=l1", undefined, { id: "p1" }, "stock.getProductStock", "admin", 200],
  ["stock/movements", "GET", "/stock/movements?companyId=c1&productId=p1&type=transfer_in&from=2026-01-01", undefined, {}, "stock.listMovements", "admin", 200],
  ["stock/products/[id]/config", "GET", "/stock/products/p1/config", undefined, { id: "p1" }, "stock.getProductStockConfig", "admin", 200],
  ["stock/products/[id]/config", "PUT", "/stock/products/p1/config", { storable: true, baseUnit: "lb" }, { id: "p1" }, "stock.saveProductStockConfig", "admin", 204],
  ["stock/products/[id]/presentations", "POST", "/stock/products/p1/presentations", { name: "saco", content: 25 }, { id: "p1" }, "stock.addPresentation", "admin", 201],
  ["stock/products/[id]/presentations/[presentationId]", "PATCH", "/stock/products/p1/presentations/s1", { name: "bulto" }, { id: "p1", presentationId: "s1" }, "stock.updatePresentation", "admin", 204],
  ["stock/products/[id]/presentations/[presentationId]", "PATCH", "/stock/products/p1/presentations/s1", { active: false }, { id: "p1", presentationId: "s1" }, "stock.setPresentationActive", "admin", 204],
  ["stock/products/[id]/presentations/[presentationId]", "DELETE", "/stock/products/p1/presentations/s1", undefined, { id: "p1", presentationId: "s1" }, "stock.deletePresentation", "admin", 204],
  ["stock/products/[id]/movement-units", "POST", "/stock/products/p1/movement-units", { name: "porción", equivalence: 0.2 }, { id: "p1" }, "stock.addMovementUnit", "admin", 201],
  ["stock/products/[id]/movement-units/[unitId]", "PATCH", "/stock/products/p1/movement-units/u1", { equivalence: 0.3 }, { id: "p1", unitId: "u1" }, "stock.updateMovementUnit", "admin", 204],
  ["stock/products/[id]/movement-units/[unitId]", "PATCH", "/stock/products/p1/movement-units/u1", { active: true }, { id: "p1", unitId: "u1" }, "stock.setMovementUnitActive", "admin", 204],
  ["stock/products/[id]/movement-units/[unitId]", "DELETE", "/stock/products/p1/movement-units/u1", undefined, { id: "p1", unitId: "u1" }, "stock.deleteMovementUnit", "admin", 204],
  ["stock/minimums", "PUT", "/stock/minimums", { productId: "p1", locationId: "l1", minimum: 5 }, {}, "stock.setMinimum", "admin", 204],
  ["stock/minimums", "PUT", "/stock/minimums", { productId: "p1", locationId: "l1", minimum: null }, {}, "stock.clearMinimum", "admin", 204],
  ["stock/entries/initial", "POST", "/stock/entries/initial", { productId: "p1", locationId: "w1", qty: 5, unit: "saco", unitCost: 12 }, {}, "stock.registerInitialEntry", "admin", 201],
  ["stock/entries/direct", "POST", "/stock/entries/direct", { productId: "p1", locationId: "l1", qty: 5, unit: "base" }, {}, "stock.registerDirectEntry", "operator", 201],
  ["stock/preview", "POST", "/stock/preview", { productId: "p1", locationId: "l1", qty: 2, unit: "base", picks: [{ lotId: "x", qty: 2 }] }, {}, "stock.previewConsumption", "operator", 200],
  ["stock/transfers", "POST", "/stock/transfers", { productId: "p1", fromLocationId: "w1", toLocationId: "l1", qty: 2, unit: "base" }, {}, "stock.transferStock", "admin", 201],
  ["stock/write-offs", "POST", "/stock/write-offs", { productId: "p1", locationId: "l1", qty: 1, unit: "base", reasonId: "r1" }, {}, "stock.writeOffStock", "operator", 201],
  ["stock/adjustments", "POST", "/stock/adjustments", { lotId: "x1", delta: 1, reasonText: "conteo" }, {}, "stock.adjustLot", "admin", 201],
  ["stock/surplus", "POST", "/stock/surplus", { productId: "p1", locationId: "l1", qty: 1, reasonText: "conteo" }, {}, "stock.registerSurplus", "admin", 201],
  ["stock/write-off-reasons", "GET", "/stock/write-off-reasons?companyId=c1", undefined, {}, "stock.listWriteOffReasons", "admin", 200],
  ["stock/write-off-reasons", "POST", "/stock/write-off-reasons", { companyId: "c1", code: "moho", name: "Moho" }, {}, "stock.createWriteOffReason", "admin", 201],
  ["stock/write-off-reasons/[id]", "PATCH", "/stock/write-off-reasons/r1", { name: "Moho 2" }, { id: "r1" }, "stock.renameWriteOffReason", "admin", 204],
  ["stock/write-off-reasons/[id]", "PATCH", "/stock/write-off-reasons/r1", { active: false }, { id: "r1" }, "stock.setWriteOffReasonActive", "admin", 204],
  ["stock/write-off-reasons/[id]", "DELETE", "/stock/write-off-reasons/r1", undefined, { id: "r1" }, "stock.deleteWriteOffReason", "admin", 204],
  ["solicitudes", "GET", "/solicitudes?companyId=c1&storeId=t1&status=new&page=2", undefined, {}, "requests.listRequests", "admin", 200],
  ["solicitudes", "POST", "/solicitudes", { storeId: "t1", lines: [{ productId: "p1", qty: 2, unit: "base" }] }, {}, "requests.createRequest", "admin", 201],
  ["solicitudes/bag", "GET", "/solicitudes/bag", undefined, {}, "requests.listPurchaseBag", "admin", 200],
  ["solicitudes/[id]", "GET", "/solicitudes/r1", undefined, { id: "r1" }, "requests.getRequest", "admin", 200],
  ["solicitudes/[id]/lines/[lineId]", "POST", "/solicitudes/r1/lines/l1", { kind: "to_buy", qtyBase: 2 }, { id: "r1", lineId: "l1" }, "requests.attendRequestLine", "admin", 201],
  ["pedidos", "GET", "/pedidos?status=open&buyerId=u1", undefined, {}, "orders.listOrders", "admin", 200],
  ["pedidos", "POST", "/pedidos", { lines: [{ productId: "p1", dest: "warehouse", qty: 2, unit: "kg", content: 1 }] }, {}, "orders.createOrder", "admin", 201],
  ["pedidos/[id]", "GET", "/pedidos/o1", undefined, { id: "o1" }, "orders.getOrder", "admin", 200],
  ["pedidos/[id]/buyer", "PUT", "/pedidos/o1/buyer", { buyerId: "u1" }, { id: "o1" }, "orders.assignBuyer", "admin", 204],
  ["pedidos/[id]/purchase", "POST", "/pedidos/o1/purchase", { lines: [{ lineId: "l1", qtyBought: 2, unitCost: 3 }] }, { id: "o1" }, "orders.registerPurchase", "admin", 204],
  ["pedidos/[id]/submit", "POST", "/pedidos/o1/submit", undefined, { id: "o1" }, "orders.submitReview", "admin", 200],
  ["pedidos/[id]/review", "PUT", "/pedidos/o1/review", { lines: [{ lineId: "l1", qtyReceived: 1 }] }, { id: "o1" }, "orders.saveReview", "admin", 204],
  ["pedidos/[id]/confirm", "POST", "/pedidos/o1/confirm", {}, { id: "o1" }, "orders.confirmOrder", "admin", 204],
  ["pedidos/[id]/return", "POST", "/pedidos/o1/return", { note: "faltó" }, { id: "o1" }, "orders.returnOrder", "admin", 204],
  ["pedidos/[id]/adjustments", "POST", "/pedidos/o1/adjustments", { reason: "conteo", lines: [{ lotId: "x1", delta: 1 }] }, { id: "o1" }, "orders.adjustOrder", "admin", 201],
  ["history/[module]", "GET", "/history/products?companyId=c1&actions=create,update", undefined, { module: "products" }, "history.listHistory", "admin", 200],
  ["auth-events", "GET", "/auth-events?companyId=c1&events=login_ok", undefined, {}, "history.listAuthEvents", "admin", 200],
];

const call = async (r: Row, token?: string, body: unknown = r[3]) => {
  setContainerForTests({
    api: () => deep("") as never,
    createAdmin: (async (...args: unknown[]) => {
      calls.push({ path: "createAdmin", args });
      if ((args[0] as { kind: string }).kind !== "superadmin") throw new Forbidden();
      return { adminId: "a", temporaryPassword: "pw" };
    }) as never,
  });
  const mod = await load(r[0]);
  const init: RequestInit = {
    method: r[1],
    headers: { ...(token && { authorization: `Bearer ${token}` }), "content-type": "application/json" },
    ...(body !== undefined && { body: JSON.stringify(body) }),
  };
  return mod[r[1]](new Request(`http://x/api/v1${r[2]}`, init), { params: Promise.resolve(r[4]) });
};

describe("endpoints", () => {
  allowed = "admin";
  for (const r of rows) {
    const label = `${r[1]} ${r[2]}`;
    it(`${label}: 401 without token, 403 without permission, ${r[7]} on success`, async () => {
      allowed = r[6];
      expect((await call(r)).status).toBe(401);
      expect(calls).toHaveLength(0);
      allowed = "nobody";
      expect((await call(r, r[6])).status).toBe(403);
      allowed = r[6];
      calls = [];
      if (r[1] === "GET" && !r[0].startsWith("history") && r[0] !== "auth-events") result = [];
      const res = await call(r, r[6]);
      expect(res.status).toBe(r[7]);
      expect(calls.at(-1)?.path).toBe(r[5]);
      expect((calls.at(-1)?.args[0] as { channel: string }).channel).toBe("api");
    });
  }

  it("POST /admins creates through the use case and hides the password from caches", async () => {
    const r: Row = ["admins", "POST", "/admins", { email: "a@b.co", displayName: "A" }, {}, "createAdmin", "superadmin", 201];
    allowed = "superadmin";
    expect((await call(r)).status).toBe(401);
    expect((await call(r, "operator")).status).toBe(403);
    const res = await call(r, "superadmin");
    expect(res.status).toBe(201);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ adminId: "a", temporaryPassword: "pw" });
  });

  it("returns the PIN once with no-store on :reset-pin and :unlock", async () => {
    allowed = "admin";
    result = { pin: "123456" };
    for (const i of [18, 19]) {
      const res = await call(rows[i], "admin");
      expect(res.headers.get("cache-control")).toBe("no-store");
      expect(await res.json()).toEqual({ pin: "123456" });
    }
  });

  it("action endpoints are restricted to the use case's actors", async () => {
    allowed = "admin";
    for (const i of [4, 18, 19, 20]) expect((await call(rows[i], "operator")).status).toBe(403);
  });

  it("422 on invalid input and 404 on an unknown action", async () => {
    allowed = "admin";
    expect((await call(rows[2], "admin", { name: 5 })).status).toBe(422);
    const bad: Row = ["users/[id]", "POST", "/users/u1:explode", undefined, { id: "u1:explode" }, "", "admin", 404];
    expect((await call(bad, "admin")).status).toBe(404);
  });

  it("history and lists are cursor-paginated", async () => {
    allowed = "admin";
    result = Array.from({ length: 3 }, (_, i) => ({ id: i }));
    const res = await (await call(["companies", "GET", "/companies?limit=2", undefined, {}, "org.listCompanies", "admin", 200], "admin")).json();
    expect(res.items).toHaveLength(2);
    expect(res.nextCursor).toBe("2");
    await call(rows.find((r) => r[0] === "history/[module]")!, "admin");
    expect(calls.at(-1)?.args[1]).toMatchObject({ module: "products", actions: ["create", "update"], companyId: "c1" });
  });

  it("maps stock domain errors to problem+json and never leaks 500 details", async () => {
    const r = rows.find((x) => x[5] === "stock.transferStock")!;
    const failWith = (e: Error) => {
      setContainerForTests({
        api: () => ({ stock: { transferStock: async () => { throw e; } } }) as never,
        createAdmin: (async () => ({})) as never,
      });
      return load(r[0]).then((m) => m.POST(new Request("http://x/api/v1/stock/transfers", { method: "POST", headers: { authorization: "Bearer admin" }, body: JSON.stringify(r[3]) }), {}));
    };
    for (const [code, status] of [["INSUFFICIENT_STOCK", 422], ["LOT_EXCEEDED", 422], ["QUANTITY_MISMATCH", 422], ["CHOOSE_LOT_FORBIDDEN", 403], ["COST_NOT_ALLOWED", 403], ["BASE_UNIT_IN_USE", 409], ["NAME_TAKEN", 409]] as const) {
      const res = await failWith(new RuleViolation(code));
      expect([res.status, (await res.json()).code]).toEqual([status, code]);
    }
    expect((await failWith(new NotFound())).status).toBe(404);
    expect((await call(r, "admin", { productId: "p1" })).status).toBe(422);
  });

  it("refuses admins without aal2 and users who must change their password", async () => {
    allowed = "admin";
    expect((await call(rows[1], "aal1admin")).status).toBe(401);
    expect((await call(rows[1], "mustchange")).status).toBe(401);
    expect((await call(rows[1], "operator")).status).toBe(403);
  });

  it("the OpenAPI document includes every tested route", () => {
    const doc = buildOpenApiDocument() as { paths: Record<string, Record<string, unknown>> };
    for (const r of rows) {
      const url = "/api/v1" + r[2].split("?")[0];
      const found = Object.keys(doc.paths).some(
        (p) => new RegExp("^" + p.replace(/\{[^}]+\}/g, "[^/:]+") + "$").test(url) && r[1].toLowerCase() in doc.paths[p],
      );
      expect(found, `${r[1]} ${url}`).toBe(true);
    }
  });
});
