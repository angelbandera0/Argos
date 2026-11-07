import { describe, expect, it } from "vitest";
import { translateOrderError } from "@/core/domain/errors";
import { comparison, shortageValue, validateReparto } from "@/core/domain/orders";
import * as c from "@/core/application/use-cases/orders/commands";
import { makeGetOrder, makeListOrders } from "@/core/application/use-cases/orders/queries";
import type { SpecialGrant } from "@/core/domain/permissions";
import { InMemoryOrders } from "../../fakes/in-memory-orders";
import { admin, operator } from "./catalog-setup";
import { stockSetup } from "./stock-setup";

function orderSetup() {
  const base = stockSetup();
  const orders = new InMemoryOrders();
  orders.eligible.add("u-all").add("u-view");
  const deps = { ...base.deps, orders };
  const give = (user: string, ...sp: Array<[SpecialGrant["permission"], boolean]>) => {
    base.deps.access.byUser[user][0].specialPermissions = sp.map(([permission, warehouse]) => ({ permission, warehouse }));
  };
  give("u-edit", ["build_orders", true], ["review_orders", true], ["correct_orders", true]);
  give("u-all", ["make_purchases", false], ["review_orders", false], ["see_costs", false]);
  give("u-view", ["make_purchases", false]);
  give("u-create", ["review_orders", true]);
  return {
    orders,
    create: c.makeCreateOrder(deps),
    assign: c.makeAssignBuyer(deps),
    purchase: c.makeRegisterPurchase(deps),
    submit: c.makeSubmitReview(deps),
    save: c.makeSaveReview(deps),
    confirm: c.makeConfirmOrder(deps),
    giveBack: c.makeReturnOrder(deps),
    adjust: c.makeAdjustOrder(deps),
    list: makeListOrders(deps),
    get: makeGetOrder(deps),
  };
}

const A = admin("a1");
const builder = operator("u-edit");
const buyer = operator("u-view");
const direct = { productId: "p1", dest: "direct" as const, qty: 10, unit: "saco", content: 100, plan: [{ storeId: "t1", qty: 6 }, { storeId: "t2", qty: 4 }] };
const store = { productId: "p2", dest: "store" as const, storeId: "t2", qty: 3, unit: "kg", content: 1 };

async function inReview(s: ReturnType<typeof orderSetup>, given = 500) {
  const id = await s.create(builder, { lines: [direct, store] });
  await s.assign(builder, { orderId: id, buyerId: "u-view" });
  await s.purchase(buyer, { orderId: id, amountGiven: given, lines: [{ lineId: `${id}-l1`, qtyBought: 9, unitCost: 50 }, { lineId: `${id}-l2`, qtyBought: 3, unitCost: 10 }] });
  return { id, cmp: await s.submit(buyer, { orderId: id }) };
}

describe("domain", () => {
  it("CA-03b: delivered, spent, leftover; leftover unknown without an amount", () => {
    expect(comparison(500, [{ qtyBought: 9, unitCost: 50 }, { qtyBought: 2, unitCost: 10 }])).toEqual({ given: 500, spent: 470, leftover: 30 });
    expect(comparison(null, [{ qtyBought: 1, unitCost: 1 }]).leftover).toBeNull();
  });
  it("CA-06: shortage is valued; unknown cost stays null, never 0", () => {
    expect(shortageValue(9, 8, 50)).toBe(50);
    expect(shortageValue(9, 9, 50)).toBe(0);
    expect(shortageValue(9, 8, null)).toBeNull();
  });
  it("CA-07: direct lines need a split that adds up", () => {
    expect(() => validateReparto("direct", 8, undefined)).toThrow(expect.objectContaining({ code: "REPARTO_REQUIRED" }));
    expect(() => validateReparto("direct", 8, [{ storeId: "t1", qty: 5 }])).toThrow(expect.objectContaining({ code: "REPARTO_MISMATCH" }));
    expect(() => validateReparto("direct", 8, [{ storeId: "t1", qty: 5 }, { storeId: "t2", qty: 3 }])).not.toThrow();
    expect(() => validateReparto("warehouse", 8, undefined)).not.toThrow();
    expect(() => validateReparto("direct", 0, undefined)).not.toThrow();
  });
  it("translates order errors", () => {
    expect(translateOrderError("REPARTO_REQUIRED")).toMatchObject({ code: "REPARTO_REQUIRED" });
    expect(translateOrderError("ORDER_NOT_FOUND").name).toBe("NotFound");
    expect(translateOrderError("LOT_EXCEEDED")).toMatchObject({ code: "LOT_EXCEEDED" });
  });
});

describe("build and assign", () => {
  it("only build_orders creates; lines are validated", async () => {
    const s = orderSetup();
    await expect(s.create(buyer, { lines: [store] })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.create(builder, { lines: [] })).rejects.toMatchObject({ code: "EMPTY_ORDER" });
    await expect(s.create(builder, { lines: [{ ...direct, plan: [{ storeId: "t1", qty: 2 }] }] })).rejects.toMatchObject({ code: "PLAN_MISMATCH" });
    expect(await s.create(builder, { lines: [direct, store], note: " urge " })).toBe("ord-1");
    expect(s.orders.orders[0].note).toBe("urge");
  });
  it("the buyer must be eligible", async () => {
    const s = orderSetup();
    const id = await s.create(builder, { lines: [store] });
    await expect(s.assign(builder, { orderId: id, buyerId: "u-none" })).rejects.toMatchObject({ code: "BUYER_NOT_ELIGIBLE" });
    await s.assign(builder, { orderId: id, buyerId: "u-view" });
    expect(s.orders.orders[0].buyerId).toBe("u-view");
  });
});

describe("purchase (CA-03)", () => {
  it("only the buyer registers; submit returns given/spent/leftover", async () => {
    const s = orderSetup();
    const id = await s.create(builder, { lines: [direct, store] });
    await s.assign(builder, { orderId: id, buyerId: "u-view" });
    await expect(s.purchase(operator("u-all"), { orderId: id, lines: [] })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.submit(buyer, { orderId: id })).rejects.toMatchObject({ code: "PURCHASE_INCOMPLETE" });
    await expect(s.purchase(buyer, { orderId: id, lines: [{ lineId: `${id}-l1`, qtyBought: -1, unitCost: 1 }] })).rejects.toMatchObject({ code: "INVALID_QUANTITY" });
    const { cmp } = await inReview(s);
    expect(cmp).toEqual({ given: 500, spent: 480, leftover: 20 });
  });
});

describe("review (CA-04, CA-05, CA-06, CA-07)", () => {
  it("CA-04: stock does not change until confirmed; partial review keeps in_review", async () => {
    const s = orderSetup();
    const { id } = await inReview(s);
    await s.save(builder, { orderId: id, lines: [{ lineId: `${id}-l1`, qtyReceived: 8 }] });
    expect(s.orders.orders[0]).toMatchObject({ status: "in_review" });
    expect(s.orders.entered).toEqual({});
  });
  it("CA-05: the buyer cannot review", async () => {
    const s = orderSetup();
    const { id } = await inReview(s);
    const self = operator("u-all");
    await s.assign(builder, { orderId: id, buyerId: "u-all" }).catch(() => undefined);
    s.orders.orders[0].buyerId = "u-all";
    for (const run of [
      () => s.save(self, { orderId: id, lines: [] }),
      () => s.confirm(self, { orderId: id }),
      () => s.giveBack(self, { orderId: id, note: "no" + "ta" }),
    ]) await expect(run()).rejects.toMatchObject({ code: "BUYER_CANNOT_REVIEW" });
    await expect(s.confirm(buyer, { orderId: id })).rejects.toMatchObject({ name: "Forbidden" });
  });
  it("CA-06 and CA-07: confirm enters only what was received and requires the split", async () => {
    const s = orderSetup();
    const { id } = await inReview(s);
    await expect(s.confirm(builder, { orderId: id })).rejects.toMatchObject({ code: "REPARTO_REQUIRED" });
    await expect(s.confirm(builder, { orderId: id, lines: [{ lineId: `${id}-l1`, qtyReceived: 8, reparto: [{ storeId: "t1", qty: 5 }] }] })).rejects.toMatchObject({ code: "REPARTO_MISMATCH" });
    await s.confirm(builder, { orderId: id, lines: [{ lineId: `${id}-l1`, qtyReceived: 8, reparto: [{ storeId: "t1", qty: 5 }, { storeId: "t2", qty: 3 }] }] });
    expect(s.orders.entered).toEqual({ [`${id}-l1`]: 8, [`${id}-l2`]: 3 });
    expect(s.orders.orders[0]).toMatchObject({ status: "fulfilled", shortageValue: 50 });
    await expect(s.confirm(builder, { orderId: id })).rejects.toMatchObject({ code: "INVALID_STATUS" });
  });
  it("return needs a note and goes back to the buyer", async () => {
    const s = orderSetup();
    const { id } = await inReview(s);
    await expect(s.giveBack(builder, { orderId: id, note: " " })).rejects.toMatchObject({ code: "NOTE_REQUIRED" });
    await s.giveBack(builder, { orderId: id, note: " faltan costos " });
    expect(s.orders.orders[0]).toMatchObject({ status: "returned", returnNote: "faltan costos" });
    await s.purchase(buyer, { orderId: id, lines: [{ lineId: `${id}-l1`, qtyBought: 9, unitCost: 50 }] });
  });
});

describe("correct (CA-08)", () => {
  it("only fulfilled orders, with permission and a reason", async () => {
    const s = orderSetup();
    const { id } = await inReview(s);
    const lines = [{ lotId: "lot1", delta: -1 }];
    await expect(s.adjust(builder, { orderId: id, reason: "error de captura", lines })).rejects.toMatchObject({ code: "INVALID_STATUS" });
    await s.confirm(builder, { orderId: id, lines: [{ lineId: `${id}-l1`, reparto: [{ storeId: "t1", qty: 9 }] }] });
    await expect(s.adjust(operator("u-create"), { orderId: id, reason: "error de captura", lines })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.adjust(builder, { orderId: id, reason: "x", lines })).rejects.toMatchObject({ code: "REASON_TEXT_REQUIRED" });
    await expect(s.adjust(builder, { orderId: id, reason: "error de captura", lines: [] })).rejects.toMatchObject({ code: "INVALID_LINES" });
    expect(await s.adjust(builder, { orderId: id, reason: " error de captura ", lines })).toBe("adj-1");
    expect(s.orders.adjusted[0].reason).toBe("error de captura");
  });
});

describe("queries", () => {
  it("costs are hidden without see_costs; null stays null with permission", async () => {
    const s = orderSetup();
    const { id } = await inReview(s);
    s.orders.orders[0].lines[1].unitCost = null;
    const hidden = await s.get(builder, { orderId: id });
    expect(hidden).not.toHaveProperty("spent");
    expect(hidden.lines[0]).not.toHaveProperty("unitCost");
    const seen = await s.get(A, { orderId: id, companyId: "c1" });
    expect(seen.spent).toBe(480);
    expect(seen.lines[1].unitCost).toBeNull();
  });
  it("the buyer sees their own purchase costs but not the shortage value", async () => {
    const s = orderSetup();
    const { id } = await inReview(s);
    const own = await s.get(buyer, { orderId: id });
    expect(own.spent).toBe(480);
    expect(own.lines[0].unitCost).toBe(50);
    expect(own).toHaveProperty("shortageValue", undefined);
    expect(own.lines[0]).not.toHaveProperty("shortageValue");
  });
  it("a buyer sees only their orders; strangers get nothing", async () => {
    const s = orderSetup();
    await inReview(s);
    await s.create(builder, { lines: [store] });
    expect((await s.list(buyer, {})).total).toBe(1);
    expect((await s.list(builder, {})).total).toBe(2);
    expect((await s.list(builder, { page: 2, pageSize: 1 })).items).toHaveLength(1);
    expect((await s.list(builder, { createdFrom: "2999-01-01" })).total).toBe(0);
    await expect(s.list(operator("u-none"), {})).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.get(operator("u-none"), { orderId: "ord-1" })).rejects.toMatchObject({ name: "NotFound" });
  });
});
