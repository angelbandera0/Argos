import { describe, expect, it } from "vitest";
import { canSeeCosts } from "@/core/application/use-cases/stock/shared";
import { admin, operator, superadmin } from "./catalog-setup";
import { stockSetup } from "./stock-setup";

const A = admin("a1");

describe("stock queries", () => {
  it("lists locations by visibility", async () => {
    const s = stockSetup();
    expect((await s.locations(A, { companyId: "c1" })).map((l) => l.id)).toContain("w1");
    expect((await s.locations(operator("u-view"))).map((l) => l.id)).toEqual(["l-t-u-view"]);
    expect((await s.locations(operator("u-edit"))).map((l) => l.id)).toEqual(["w1", "l-t-u-edit"]);
    await expect(s.locations(operator("u-none"))).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.locations(admin("a2"), { companyId: "c1" })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.locations(superadmin)).rejects.toMatchObject({ name: "Forbidden" });
  });

  it("filters status with counts and paginates", async () => {
    const s = stockSetup();
    const all = await s.status(A, { companyId: "c1", locationId: "w1" });
    expect(all.items.map((l) => l.productName)).toEqual(["Aceite", "Arroz", "Sal"]);
    expect(all.counts).toEqual({ normal: 1, low: 1, out: 1 });
    expect((await s.status(A, { companyId: "c1", locationId: "w1", status: "low" })).items.map((l) => l.productId)).toEqual(["p2"]);
    expect((await s.status(A, { companyId: "c1", locationId: "w1", q: "ARR" })).total).toBe(1);
    expect((await s.status(A, { companyId: "c1", locationId: "w1", categoryId: "cat1" })).total).toBe(2);
    const p2 = await s.status(A, { companyId: "c1", locationId: "w1", page: 2, pageSize: 2 });
    expect([p2.items.length, p2.total]).toEqual([1, 3]);
    await expect(s.status(A, { companyId: "c1", locationId: "w1", status: "x" })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    await expect(s.status(A, { companyId: "c1", locationId: "w1", page: 0 })).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  it("read permissions: own store only, warehouse needs a warehouse special permission", async () => {
    const s = stockSetup();
    expect((await s.status(operator("u-view"), { locationId: "l-t-u-view" })).items).toHaveLength(1);
    await expect(s.status(operator("u-view"), { locationId: "w1" })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.status(operator("u-all"), { locationId: "l-t-u-view" })).rejects.toMatchObject({ name: "Forbidden" });
    expect((await s.status(operator("u-edit"), { locationId: "w1" })).total).toBe(3);
    await expect(s.status(operator("u-none"), { locationId: "l-t-u-none" })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.status(operator("u-view"), { locationId: "w2" })).rejects.toMatchObject({ name: "NotFound" });
  });

  it("product stock: costs hidden without permission, null stays null", async () => {
    const s = stockSetup();
    const hidden = await s.productStock(operator("u-edit"), { productId: "p1", locationId: "w1" });
    expect(hidden.lots.map((l) => l.id)).toEqual(["lot1", "lot2"]);
    expect(hidden.lots.every((l) => !("unitCost" in l))).toBe(true);
    expect([hidden.quantity, hidden.minimum, hidden.status]).toEqual([10, 5, "normal"]);
    const full = await s.productStock(A, { productId: "p1", locationId: "w1", onlyAvailable: false });
    expect(full.lots.map((l) => l.unitCost)).toEqual([{ amount: 1.5, currencyId: "mxn" }, null, { amount: 2, currencyId: "mxn" }]);
    const own = await s.productStock(operator("u-all"), { productId: "p1", locationId: "l-t-u-all" });
    expect(own).toMatchObject({ quantity: 0, status: "out", lots: [] });
    await expect(s.productStock(operator("u-edit"), { productId: "px", locationId: "w1" })).rejects.toMatchObject({ name: "NotFound" });
  });

  it("canSeeCosts: admins and see_costs only", () => {
    expect(canSeeCosts(A, null)).toBe(true);
    expect(canSeeCosts(operator("u"), { specialPermissions: [{ permission: "see_costs", warehouse: false }] })).toBe(true);
    expect(canSeeCosts(operator("u"), { specialPermissions: [{ permission: "transfer", warehouse: true }] })).toBe(false);
  });

  it("movements: filters, pagination, visibility and cost hiding", async () => {
    const s = stockSetup();
    const all = await s.movements(A, { companyId: "c1" });
    expect(all.items.map((m) => m.id)).toEqual(["m4", "m3", "m2", "m1"]);
    expect(all.items.find((m) => m.id === "m2")?.unitCost).toBeNull();
    expect((await s.movements(A, { companyId: "c1", productId: "p2" })).total).toBe(1);
    expect((await s.movements(A, { companyId: "c1", type: "entry", locationId: "w1" })).total).toBe(2);
    expect((await s.movements(A, { companyId: "c1", from: "2026-01-02", to: "2026-01-03" })).items.map((m) => m.id)).toEqual(["m3", "m2"]);
    expect((await s.movements(A, { companyId: "c1", page: 2, pageSize: 3 })).items.map((m) => m.id)).toEqual(["m1"]);
    const own = await s.movements(operator("u-view"));
    expect(own.items.map((m) => m.id)).toEqual(["m4"]);
    expect("unitCost" in own.items[0]).toBe(false);
    expect((await s.movements(operator("u-edit"))).total).toBe(3);
    await expect(s.movements(operator("u-view"), { locationId: "w1" })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.movements(operator("u-none"))).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.movements(A, { companyId: "c1", from: "nope" })).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  it("reads the product config", async () => {
    const s = stockSetup();
    expect(await s.getConfig(operator("u-view"), { productId: "p1" })).toMatchObject({ baseUnit: "lb", magnitude: "weight" });
    await expect(s.getConfig(operator("u-none"), { productId: "p1" })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.getConfig(operator("u-other"), { productId: "p1" })).rejects.toMatchObject({ name: "NotFound" });
  });
});
