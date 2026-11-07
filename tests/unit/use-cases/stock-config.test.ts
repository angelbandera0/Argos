import { describe, expect, it } from "vitest";
import { admin, operator } from "./catalog-setup";
import { stockSetup } from "./stock-setup";

const A = admin("a1");

describe("stock configuration", () => {
  it("saves storable and base unit; rejects unknown units and units in use", async () => {
    const s = stockSetup();
    await s.saveConfig(A, { productId: "p1", storable: false, baseUnit: "kg" });
    expect(await s.getConfig(A, { productId: "p1" })).toMatchObject({ storable: false, baseUnit: "kg" });
    await expect(s.saveConfig(A, { productId: "p1", storable: true, baseUnit: "gal" })).rejects.toMatchObject({ code: "INVALID_INPUT" });
    s.stock.baseUnitLocked.add("p1");
    await expect(s.saveConfig(A, { productId: "p1", storable: true, baseUnit: "l" })).rejects.toMatchObject({ code: "BASE_UNIT_LOCKED" });
    expect(await s.getConfig(A, { productId: "p1" })).toMatchObject({ baseUnitLocked: true });
    await expect(s.saveConfig(A, { productId: "p1", storable: true, baseUnit: "kg" })).resolves.toBeUndefined();
    await expect(s.saveConfig(operator("u-view"), { productId: "p1", storable: true, baseUnit: "g" })).rejects.toMatchObject({ name: "Forbidden" });
  });

  it("permissions: admin or configure_units with warehouse", async () => {
    const s = stockSetup();
    await s.saveConfig(operator("u-edit"), { productId: "p1", storable: true, baseUnit: "kg" });
    await expect(s.saveConfig(operator("u-create"), { productId: "p1", storable: true, baseUnit: "kg" })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.saveConfig(operator("u-view"), { productId: "p1", storable: true, baseUnit: "kg" })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.addPresentation(operator("u-view"), { productId: "p1", name: "Saco", content: 1 })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.saveConfig(admin("a2"), { productId: "p1", storable: true, baseUnit: "kg" })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.saveConfig(operator("u-other"), { productId: "p1", storable: true, baseUnit: "kg" })).rejects.toMatchObject({ name: "NotFound" });
  });

  it("presentations: validation, duplicates, update, active, delete", async () => {
    const s = stockSetup();
    const p = await s.addPresentation(operator("u-edit"), { productId: "p1", name: "  Saco  25 ", content: 25.0004 });
    expect(p).toMatchObject({ name: "Saco 25", content: 25, active: true });
    await expect(s.addPresentation(A, { productId: "p1", name: "saco 25", content: 1 })).rejects.toMatchObject({ code: "NAME_TAKEN" });
    await expect(s.addPresentation(A, { productId: "p1", name: " ", content: 1 })).rejects.toMatchObject({ code: "INVALID_NAME" });
    await expect(s.addPresentation(A, { productId: "p1", name: "x".repeat(61), content: 1 })).rejects.toMatchObject({ code: "INVALID_NAME" });
    await expect(s.addPresentation(A, { productId: "p1", name: "Caja", content: 0 })).rejects.toMatchObject({ code: "INVALID_CONTENT" });
    await expect(s.addPresentation(A, { productId: "p1", name: "Caja", content: -1 })).rejects.toMatchObject({ code: "NEGATIVE_QUANTITY" });
    const b = await s.addPresentation(A, { productId: "p1", name: "Caja", content: 10 });
    await expect(s.updatePresentation(A, { productId: "p1", id: b.id, name: "SACO 25" })).rejects.toMatchObject({ code: "NAME_TAKEN" });
    await s.updatePresentation(A, { productId: "p1", id: b.id, name: "Caja", content: 12.5 });
    await s.setPresentationActive(A, { productId: "p1", id: b.id, active: false });
    expect((await s.getConfig(A, { productId: "p1" })).presentations).toMatchObject([{ name: "Saco 25" }, { name: "Caja", content: 12.5, active: false }]);
    await s.deletePresentation(A, { productId: "p1", id: b.id });
    expect((await s.getConfig(A, { productId: "p1" })).presentations).toHaveLength(1);
    await expect(s.deletePresentation(A, { productId: "p1", id: "zzz" })).rejects.toMatchObject({ name: "NotFound" });
  });

  it("movement units: same rules with equivalence", async () => {
    const s = stockSetup();
    const u = await s.addUnit(A, { productId: "p1", name: "Cucharada", equivalence: 0.03 });
    expect(u).toMatchObject({ equivalence: 0.03 });
    await expect(s.addUnit(A, { productId: "p1", name: "cucharada", equivalence: 1 })).rejects.toMatchObject({ code: "NAME_TAKEN" });
    await expect(s.addUnit(A, { productId: "p1", name: "Taza", equivalence: 0.0001 })).rejects.toMatchObject({ code: "INVALID_CONTENT" });
    await s.updateUnit(A, { productId: "p1", id: u.id, equivalence: 0.05 });
    await s.setUnitActive(A, { productId: "p1", id: u.id, active: false });
    expect((await s.getConfig(A, { productId: "p1" })).movementUnits).toMatchObject([{ equivalence: 0.05, active: false }]);
    await expect(s.updateUnit(operator("u-create"), { productId: "p1", id: u.id, name: "X" })).rejects.toMatchObject({ name: "Forbidden" });
    await s.deleteUnit(A, { productId: "p1", id: u.id });
    expect((await s.getConfig(A, { productId: "p1" })).movementUnits).toEqual([]);
  });

  it("minimums by scope", async () => {
    const s = stockSetup();
    const min = async (loc: string) => (await s.stock.getStockLine("p1", loc))?.minimum;
    await s.setMinimum(A, { productId: "p1", locationId: "w1", minimum: 7.5 });
    expect(await min("w1")).toBe(7.5);
    await s.clearMinimum(operator("u-edit"), { productId: "p1", locationId: "w1" });
    expect(await min("w1")).toBeNull();
    await expect(s.setMinimum(operator("u-all"), { productId: "p1", locationId: "w1", minimum: 1 })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.setMinimum(operator("u-all"), { productId: "p1", locationId: "l-t-u-view", minimum: 1 })).rejects.toMatchObject({ name: "Forbidden" });
    await s.setMinimum(operator("u-all"), { productId: "p1", locationId: "l-t-u-all", minimum: 1 });
    await expect(s.setMinimum(operator("u-view"), { productId: "p1", locationId: "l-t-u-view", minimum: 1 })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(s.setMinimum(A, { productId: "p1", locationId: "w1", minimum: -1 })).rejects.toMatchObject({ code: "NEGATIVE_QUANTITY" });
    await expect(s.setMinimum(A, { productId: "p1", locationId: "w2", minimum: 1 })).rejects.toMatchObject({ name: "NotFound" });
  });
});
