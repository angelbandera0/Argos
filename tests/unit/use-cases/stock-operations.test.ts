import { describe, expect, it } from "vitest";
import { admin, operator } from "./catalog-setup";
import { opsSetup } from "./stock-ops-setup";

const A = admin("a1");
const base = { productId: "p1", locationId: "w1" };

describe("entries", () => {
  it("CA-01: 5 sacos of 25 lb with price 300 per saco costs 12 per base unit", async () => {
    const s = opsSetup();
    expect(await s.initialEntry(A, { ...base, qty: 5, unit: "saco", pricePerPresentation: 300, currencyId: "mxn" })).toBe("lot-new");
    expect(s.ops.calls.registerInitialEntry[0]).toMatchObject({ qty: 5, unit: "Saco", content: 25, unitCost: 12, currencyId: "mxn" });
    await s.initialEntry(A, { ...base, qty: 5, unit: "Saco", content: 24, pricePerPresentation: 300 });
    expect(s.ops.calls.registerInitialEntry[1]).toMatchObject({ content: 24, unitCost: 12.5 });
    await s.initialEntry(A, { ...base, qty: 2.5, unit: "base", unitCost: 3 });
    expect(s.ops.calls.registerInitialEntry[2]).toMatchObject({ qty: 2.5, unit: "lb", content: 1, unitCost: 3 });
  });

  it("validates quantity, unit, content, kind of location and storability", async () => {
    const s = opsSetup();
    await expect(s.initialEntry(A, { ...base, qty: 0, unit: "Saco" })).rejects.toMatchObject({ code: "INVALID_QUANTITY" });
    await expect(s.initialEntry(A, { ...base, qty: 1, unit: "Caja" })).rejects.toMatchObject({ code: "INVALID_UNIT" });
    await expect(s.initialEntry(A, { ...base, qty: 1, unit: "Saco", content: 0 })).rejects.toMatchObject({ code: "INVALID_QUANTITY" });
    await expect(s.initialEntry(A, { ...base, locationId: "l-t-u-all", qty: 1, unit: "base" })).rejects.toMatchObject({ code: "NOT_WAREHOUSE" });
    await expect(s.directEntry(A, { ...base, qty: 1, unit: "base" })).rejects.toMatchObject({ code: "NOT_STORE" });
    s.stock.configs.get("p1")!.storable = false;
    await expect(s.initialEntry(A, { ...base, qty: 1, unit: "base" })).rejects.toMatchObject({ code: "PRODUCT_NOT_STORABLE" });
    expect(s.ops.calls.registerInitialEntry).toHaveLength(0);
  });

  it("costs are rejected without see_costs and never reach the database", async () => {
    const s = opsSetup();
    s.give("u-edit", ["initial_entry", true]);
    await expect(s.initialEntry(operator("u-edit"), { ...base, qty: 1, unit: "base", unitCost: 1 })).rejects.toMatchObject({ code: "COST_NOT_ALLOWED" });
    expect(s.ops.calls.registerInitialEntry).toHaveLength(0);
    await s.initialEntry(operator("u-edit"), { ...base, qty: 1, unit: "base" });
    s.give("u-edit", ["initial_entry", true], ["see_costs", false]);
    await s.initialEntry(operator("u-edit"), { ...base, qty: 1, unit: "base", unitCost: 1 });
    expect(s.ops.calls.registerInitialEntry).toHaveLength(2);
  });

  it("permissions by scope", async () => {
    const s = opsSetup();
    await expect(s.initialEntry(operator("u-view"), { ...base, qty: 1, unit: "base" })).rejects.toMatchObject({ name: "Forbidden" });
    s.give("u-all", ["initial_entry", false], ["direct_store_entry", false]);
    await expect(s.initialEntry(operator("u-all"), { ...base, qty: 1, unit: "base" })).rejects.toMatchObject({ name: "Forbidden" });
    await s.directEntry(operator("u-all"), { ...base, locationId: "l-t-u-all", qty: 1, unit: "base" });
    await expect(s.directEntry(operator("u-all"), { ...base, locationId: "l-t-u-view", qty: 1, unit: "base" })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.initialEntry(admin("a2"), { ...base, qty: 1, unit: "base" })).rejects.toMatchObject({ name: "Forbidden" });
  });
});

describe("preview, transfer and write-off", () => {
  it("CA-02: 10 porciones of 0,200 lb are 2 lb; preview does not write", async () => {
    const s = opsSetup();
    const p = await s.preview(A, { ...base, qty: 10, unit: "porción" });
    expect(p).toMatchObject({ baseQty: 2, allocation: [{ lotId: "lot1", qty: 2 }], isDeviation: false, errors: undefined });
    expect(Object.values(s.ops.calls).flat()).toHaveLength(0);
    await expect(s.preview(A, { ...base, qty: 1, unit: "Caja" })).rejects.toMatchObject({ code: "INVALID_UNIT" });
  });

  it("CA-03: FIFO by default, deviation requires choose_lot", async () => {
    const s = opsSetup();
    const fifo = await s.preview(A, { ...base, qty: 5, unit: "base" });
    expect(fifo.allocation).toEqual([{ lotId: "lot1", qty: 4 }, { lotId: "lot2", qty: 1 }]);
    const picks = [{ lotId: "lot2", qty: 5 }];
    expect(await s.preview(A, { ...base, qty: 5, unit: "base", picks })).toMatchObject({ isDeviation: true, suggested: fifo.suggested });
    const input = { productId: "p1", fromLocationId: "w1", toLocationId: "l-t-u-edit", qty: 5, unit: "base", picks };
    await expect(s.transfer(operator("u-edit"), input)).rejects.toMatchObject({ code: "CHOOSE_LOT_FORBIDDEN" });
    expect(s.ops.calls.transfer).toHaveLength(0);
    await s.transfer(A, input);
    s.give("u-edit", ["transfer", true], ["choose_lot", true]);
    await s.transfer(operator("u-edit"), input);
    await s.transfer(operator("u-edit"), { ...input, picks: fifo.allocation });
    expect(s.ops.calls.transfer).toHaveLength(3);
  });

  it("CA-04: lot rules and preview errors", async () => {
    const s = opsSetup();
    const check = (picks: Array<{ lotId: string; qty: number }>, qty = 5) => s.preview(A, { ...base, qty, unit: "base", picks });
    expect((await check([{ lotId: "lot1", qty: 5 }])).errors).toEqual(["LOT_EXCEEDED"]);
    expect((await check([{ lotId: "lot1", qty: 2 }, { lotId: "lot1", qty: 3 }])).errors).toEqual(["DUPLICATE_LOT"]);
    expect((await check([{ lotId: "lot1", qty: 2 }])).errors).toEqual(["QUANTITY_MISMATCH"]);
    expect((await check([{ lotId: "nope", qty: 5 }])).errors).toEqual(["LOT_NOT_FOUND"]);
    expect((await s.preview(A, { ...base, qty: 99, unit: "base" })).errors).toEqual(["INSUFFICIENT_STOCK"]);
    await expect(s.writeOff(A, { ...base, qty: 5, unit: "base", reasonId: "r-merma", picks: [{ lotId: "lot1", qty: 5 }] })).rejects.toMatchObject({ code: "LOT_EXCEEDED" });
    expect(s.ops.calls.writeOff).toHaveLength(0);
  });

  it("lot costs only with see_costs", async () => {
    const s = opsSetup();
    s.give("u-edit", ["transfer", true]);
    expect((await s.preview(A, { ...base, qty: 1, unit: "base" })).lots[0]).toHaveProperty("unitCost");
    expect((await s.preview(operator("u-edit"), { ...base, qty: 1, unit: "base" })).lots[0]).not.toHaveProperty("unitCost");
    s.give("u-edit", ["transfer", true], ["see_costs", false]);
    expect((await s.preview(operator("u-edit"), { ...base, qty: 1, unit: "base" })).lots[0]).toHaveProperty("unitCost");
    await expect(s.preview(operator("u-view"), { ...base, qty: 1, unit: "base" })).rejects.toMatchObject({ name: "Forbidden" });
  });

  it("transfer: origin warehouse, destination store, permission", async () => {
    const s = opsSetup();
    const input = { productId: "p1", fromLocationId: "w1", toLocationId: "l-t-u-edit", qty: 1, unit: "Porción" };
    await s.transfer(operator("u-edit"), input);
    expect(s.ops.calls.transfer[0]).toMatchObject({ qty: 1, unit: "Porción" });
    await expect(s.transfer(operator("u-view"), input)).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.transfer(A, { ...input, toLocationId: "w1" })).rejects.toMatchObject({ code: "NOT_STORE" });
    await expect(s.transfer(A, { ...input, fromLocationId: "l-t-u-edit", toLocationId: "l-t-u-all" })).rejects.toMatchObject({ code: "NOT_WAREHOUSE" });
    await expect(s.transfer(A, { ...input, toLocationId: "w2" })).rejects.toMatchObject({ name: "NotFound" });
    await expect(s.transfer(A, { ...input, qty: 0 })).rejects.toMatchObject({ code: "INVALID_QUANTITY" });
  });

  it("write-off: reason, text and scope permission", async () => {
    const s = opsSetup();
    const input = { ...base, qty: 1, unit: "base", reasonId: "r-merma" };
    await s.writeOff(A, input);
    await expect(s.writeOff(A, { ...input, reasonId: "r-off" })).rejects.toMatchObject({ code: "INVALID_REASON" });
    await expect(s.writeOff(A, { ...input, reasonId: "nope" })).rejects.toMatchObject({ code: "INVALID_REASON" });
    await expect(s.writeOff(A, { ...input, reasonId: "r-otro" })).rejects.toMatchObject({ code: "REASON_TEXT_REQUIRED" });
    await expect(s.writeOff(A, { ...input, reasonId: "r-otro", reasonText: "x".repeat(301) })).rejects.toMatchObject({ code: "REASON_TEXT_REQUIRED" });
    await s.writeOff(A, { ...input, reasonId: "r-otro", reasonText: " se cayó " });
    expect(s.ops.calls.writeOff[1]).toMatchObject({ reasonText: "se cayó" });
    s.give("u-all", ["write_off", false]);
    s.stock.lots.push({ ...s.stock.lots[0], id: "lot-s", locationId: "l-t-u-all", remaining: 3 });
    await s.writeOff(operator("u-all"), { ...input, locationId: "l-t-u-all" });
    await expect(s.writeOff(operator("u-all"), { ...input, locationId: "l-t-u-view" })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.writeOff(operator("u-all"), input)).rejects.toMatchObject({ name: "Forbidden" });
    expect(s.ops.calls.writeOff).toHaveLength(3);
  });
});

describe("adjustment and surplus", () => {
  it("adjustLot restores a lot with permission and reason", async () => {
    const s = opsSetup();
    await s.adjust(A, { lotId: "lot1", delta: -1, reasonText: " conteo " });
    expect(s.ops.calls.adjust[0]).toEqual({ lotId: "lot1", delta: -1, reasonText: "conteo" });
    await expect(s.adjust(A, { lotId: "lot1", delta: 0, reasonText: "conteo" })).rejects.toMatchObject({ code: "INVALID_QUANTITY" });
    await expect(s.adjust(A, { lotId: "lot1", delta: 1, reasonText: "ab" })).rejects.toMatchObject({ code: "REASON_TEXT_REQUIRED" });
    await expect(s.adjust(A, { lotId: "nope", delta: 1, reasonText: "conteo" })).rejects.toMatchObject({ name: "NotFound" });
    await expect(s.adjust(operator("u-edit"), { lotId: "lot1", delta: 1, reasonText: "conteo" })).rejects.toMatchObject({ name: "Forbidden" });
    s.give("u-edit", ["adjust_stock", true]);
    await s.adjust(operator("u-edit"), { lotId: "lot1", delta: 1, reasonText: "conteo" });
    expect(s.ops.calls.adjust).toHaveLength(2);
  });

  it("surplus is a separate action: base quantity, reason, cost only with see_costs", async () => {
    const s = opsSetup();
    await s.surplus(A, { ...base, qty: 2, reasonText: "sobró", unitCost: 1.5, currencyId: "mxn" });
    expect(s.ops.calls.registerSurplus[0]).toMatchObject({ qty: 2, unitCost: 1.5, currencyId: "mxn" });
    expect(s.ops.calls.adjust).toHaveLength(0);
    await expect(s.surplus(A, { ...base, qty: 0, reasonText: "sobró" })).rejects.toMatchObject({ code: "INVALID_QUANTITY" });
    await expect(s.surplus(A, { ...base, qty: 1, reasonText: "" })).rejects.toMatchObject({ code: "REASON_TEXT_REQUIRED" });
    await expect(s.surplus(operator("u-edit"), { ...base, qty: 1, reasonText: "sobró" })).rejects.toMatchObject({ name: "Forbidden" });
    s.give("u-edit", ["adjust_stock", true]);
    await expect(s.surplus(operator("u-edit"), { ...base, qty: 1, reasonText: "sobró", unitCost: 1 })).rejects.toMatchObject({ code: "COST_NOT_ALLOWED" });
    await s.surplus(operator("u-edit"), { ...base, qty: 1, reasonText: "sobró" });
    expect(s.ops.calls.registerSurplus).toHaveLength(2);
  });
});

describe("lot cost adjustment (L8)", () => {
  it("admin corrects the cost; operators need see_costs + correct_orders", async () => {
    const s = opsSetup();
    await s.adjustCost(A, { lotId: "lot1", newUnitCost: 15, reason: " error de compra " });
    expect(s.ops.calls.adjustLotCost[0]).toEqual({ lotId: "lot1", newUnitCost: 15, reason: "error de compra" });
    const op = operator("u-edit");
    await expect(s.adjustCost(op, { lotId: "lot1", newUnitCost: 15, reason: "error de compra" })).rejects.toMatchObject({ name: "Forbidden" });
    s.give("u-edit", ["see_costs", false]);
    await expect(s.adjustCost(op, { lotId: "lot1", newUnitCost: 15, reason: "error de compra" })).rejects.toMatchObject({ name: "Forbidden" });
    s.give("u-edit", ["see_costs", false], ["correct_orders", false]);
    await s.adjustCost(op, { lotId: "lot1", newUnitCost: 15, reason: "error de compra" });
    expect(s.ops.calls.adjustLotCost).toHaveLength(2);
  });

  it("never invents a cost and requires a reason", async () => {
    const s = opsSetup();
    for (const bad of [undefined, null, -1, Number.NaN, 1.1234567])
      await expect(s.adjustCost(A, { lotId: "lot1", newUnitCost: bad as unknown as number, reason: "motivo" })).rejects.toMatchObject({ code: "INVALID_COST" });
    await expect(s.adjustCost(A, { lotId: "lot1", newUnitCost: 0, reason: "  " })).rejects.toMatchObject({ code: "REASON_TEXT_REQUIRED" });
    await expect(s.adjustCost(A, { lotId: "nope", newUnitCost: 1, reason: "motivo" })).rejects.toMatchObject({ name: "NotFound" });
    expect(s.ops.calls.adjustLotCost).toHaveLength(0);
  });

  it("lists adjustments only with cost permission", async () => {
    const s = opsSetup();
    s.stock.costAdjustments.push({ id: "x", lotId: "lot1", orderId: null, oldUnitCost: 12, newUnitCost: 15, currencyId: "mxn", reason: "r", createdBy: "a1", createdAt: "2026-11-07" });
    expect(await s.listCostAdjustments(A, { lotId: "lot1" })).toHaveLength(1);
    await expect(s.listCostAdjustments(operator("u-edit"), { lotId: "lot1" })).rejects.toMatchObject({ name: "Forbidden" });
    s.give("u-edit", ["see_costs", false]);
    expect(await s.listCostAdjustments(operator("u-edit"), { lotId: "lot1" })).toHaveLength(1);
  });
});
