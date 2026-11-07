import { describe, expect, it } from "vitest";
import { lineStatus, requestStatus } from "@/core/domain/requests";
import { translateRequestError } from "@/core/domain/errors";
import { makeAttendRequestLine } from "@/core/application/use-cases/requests/attend-request-line";
import { makeCreateRequest } from "@/core/application/use-cases/requests/create-request";
import { makeGetRequest, makeListPurchaseBag, makeListRequests } from "@/core/application/use-cases/requests/queries";
import type { SpecialGrant } from "@/core/domain/permissions";
import { InMemoryRequests } from "../../fakes/in-memory-requests";
import { admin, operator } from "./catalog-setup";
import { stockSetup } from "./stock-setup";

function reqSetup() {
  const base = stockSetup();
  const requests = new InMemoryRequests({ "t-u-view": "c1", "t-u-all": "c1", "t-u-edit": "c1" });
  const deps = { ...base.deps, requests };
  const give = (user: string, view: boolean, ...sp: Array<[SpecialGrant["permission"], boolean]>) => {
    const a = deps.access.byUser[user][0];
    a.permissions = { ...a.permissions, requests: { view, create: false, edit: false, delete: false } };
    a.specialPermissions = sp.map(([permission, warehouse]) => ({ permission, warehouse }));
  };
  give("u-view", true, ["request_replenishment", false]);
  give("u-all", true);
  give("u-edit", true, ["handle_requests", true]);
  give("u-none", false);
  return {
    requests,
    create: makeCreateRequest(deps),
    attend: makeAttendRequestLine(deps),
    list: makeListRequests(deps),
    get: makeGetRequest(deps),
    bag: makeListPurchaseBag(deps),
  };
}

const A = admin("a1");
const lines = [{ productId: "p1", qty: 2, unit: "Saco" }];

describe("domain", () => {
  it("derives line and request status", () => {
    expect(lineStatus(10, [])).toBe("new");
    expect(lineStatus(10, [{ kind: "fulfilled", qtyBase: 6 }])).toBe("in_progress");
    expect(lineStatus(10, [{ kind: "fulfilled", qtyBase: 6 }, { kind: "to_buy", qtyBase: 4 }])).toBe("to_buy");
    expect(lineStatus(10, [{ kind: "fulfilled", qtyBase: 10 }])).toBe("fulfilled");
    expect(lineStatus(10, [{ kind: "rejected", qtyBase: 10 }])).toBe("rejected");
    expect(requestStatus(["new", "new"])).toBe("new");
    expect(requestStatus(["fulfilled", "new"])).toBe("in_progress");
    expect(requestStatus(["fulfilled", "pending", "to_buy"])).toBe("to_buy");
    expect(requestStatus(["rejected", "rejected"])).toBe("rejected");
    expect(requestStatus(["rejected", "fulfilled"])).toBe("fulfilled");
  });
  it("translates request errors", () => {
    expect(translateRequestError("ASSIGNMENT_EXCEEDS_LINE")).toMatchObject({ code: "ASSIGNMENT_EXCEEDS_LINE" });
    expect(translateRequestError("LINE_NOT_FOUND").name).toBe("NotFound");
    expect(translateRequestError("INSUFFICIENT_STOCK")).toMatchObject({ code: "INSUFFICIENT_STOCK" });
    expect(translateRequestError("FORBIDDEN").name).toBe("Forbidden");
  });
});

describe("createRequest", () => {
  it("the store with request_replenishment creates; others cannot", async () => {
    const s = reqSetup();
    expect(await s.create(operator("u-view"), { storeId: "t-u-view", lines, note: " urge " })).toBe("req-1");
    expect(s.requests.requests[0].note).toBe("urge");
    await expect(s.create(operator("u-all"), { storeId: "t-u-all", lines })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.create(operator("u-view"), { storeId: "t-u-all", lines })).rejects.toMatchObject({ name: "Forbidden" });
  });
  it("validates lines", async () => {
    const s = reqSetup();
    const o = operator("u-view");
    await expect(s.create(o, { storeId: "t-u-view", lines: [] })).rejects.toMatchObject({ code: "EMPTY_REQUEST" });
    await expect(s.create(o, { storeId: "t-u-view", lines: [...lines, ...lines] })).rejects.toMatchObject({ code: "DUPLICATE_PRODUCT" });
    await expect(s.create(o, { storeId: "t-u-view", lines: [{ productId: "p1", qty: 0, unit: "Saco" }] })).rejects.toMatchObject({ code: "INVALID_QUANTITY" });
    await expect(s.create(o, { storeId: "t-u-view", lines: [{ productId: "p1", qty: 1, unit: " " }] })).rejects.toMatchObject({ code: "INVALID_UNIT" });
  });
});

describe("attendRequestLine", () => {
  async function withRequest() {
    const s = reqSetup();
    await s.create(operator("u-view"), { storeId: "t-u-view", lines: [{ productId: "p1", qty: 10, unit: "base" }] });
    return s;
  }
  it("handler transfers partially, then sends the rest to buy", async () => {
    const s = await withRequest();
    const h = operator("u-edit");
    await s.attend(h, { lineId: "req-1-l1", kind: "fulfilled", qtyBase: 6, picks: [{ lotId: "lot1", qty: 6 }] });
    s.requests.requests[0].lines[0].assignments.push({ id: "a", kind: "fulfilled", qtyBase: 6, reason: null, decidedBy: null, decidedAt: "" });
    await s.attend(h, { lineId: "req-1-l1", kind: "to_buy", qtyBase: 4, picks: [{ lotId: "x", qty: 1 }] });
    expect(s.requests.attended[0]).toMatchObject({ kind: "fulfilled", qtyBase: 6, picks: [{ lotId: "lot1", qty: 6 }] });
    expect(s.requests.attended[1].picks).toBeUndefined();
  });
  it("rejects over-assignment, missing reason and non-handlers", async () => {
    const s = await withRequest();
    const h = operator("u-edit");
    await expect(s.attend(h, { lineId: "req-1-l1", kind: "pending", qtyBase: 11 })).rejects.toMatchObject({ code: "ASSIGNMENT_EXCEEDS_LINE" });
    await expect(s.attend(h, { lineId: "req-1-l1", kind: "rejected", qtyBase: 10, reason: " " })).rejects.toMatchObject({ code: "REASON_REQUIRED" });
    await expect(s.attend(h, { lineId: "req-1-l1", kind: "pending", qtyBase: 0 })).rejects.toMatchObject({ code: "INVALID_QUANTITY" });
    await expect(s.attend(h, { lineId: "nope", kind: "pending", qtyBase: 1 })).rejects.toMatchObject({ name: "NotFound" });
    await expect(s.attend(operator("u-view"), { lineId: "req-1-l1", kind: "pending", qtyBase: 1 })).rejects.toMatchObject({ name: "Forbidden" });
    await s.attend(h, { lineId: "req-1-l1", kind: "rejected", qtyBase: 10, reason: " sin presupuesto " });
    expect(s.requests.attended[0]).toMatchObject({ kind: "rejected", reason: "sin presupuesto" });
  });
});

describe("queries", () => {
  it("visibility by role", async () => {
    const s = reqSetup();
    await s.create(operator("u-view"), { storeId: "t-u-view", lines });
    await s.create(A, { companyId: "c1", storeId: "t-u-all", lines });
    expect((await s.list(A, { companyId: "c1" })).total).toBe(2);
    expect((await s.list(operator("u-edit"), {})).total).toBe(2);
    expect((await s.list(operator("u-view"), { storeId: "t-u-all" })).items.map((r) => r.storeId)).toEqual(["t-u-view"]);
    await expect(s.list(operator("u-none"), {})).rejects.toMatchObject({ name: "Forbidden" });
    expect((await s.get(operator("u-view"), { requestId: "req-1" })).id).toBe("req-1");
    await expect(s.get(operator("u-view"), { requestId: "req-2" })).rejects.toMatchObject({ name: "NotFound" });
    expect((await s.get(operator("u-edit"), { requestId: "req-2" })).id).toBe("req-2");
  });
  it("purchase bag only for handlers", async () => {
    const s = reqSetup();
    s.requests.bag.push({ productId: "p1", productName: "Arroz", storeId: "t-u-view", storeName: "T", qtyBase: 4, decisions: 1 });
    expect(await s.bag(operator("u-edit"), {})).toHaveLength(1);
    expect(await s.bag(A, { companyId: "c1" })).toHaveLength(1);
    await expect(s.bag(operator("u-view"), {})).rejects.toMatchObject({ name: "Forbidden" });
  });
});
