import { describe, expect, it } from "vitest";
import { baseAmount, costPerPresentationLabel, entryErrorMessage, entrySchema, entryProductOptions, equivalentLabel } from "@/components/stock/entry-logic";

describe("entry-logic", () => {
  it("convierte a base en milésimas exactas", () => {
    expect(baseAmount("5", 24.5)).toBe(122.5);
    expect(baseAmount("0,1", 3)).toBe(0.3);
    expect(baseAmount("", 1)).toBeNull();
    expect(baseAmount("-2", 1)).toBeNull();
  });
  it("etiqueta el equivalente", () => {
    expect(equivalentLabel("5", 25, "lb")).toContain("lb");
    expect(equivalentLabel("", 25, "lb")).toBe("");
  });
  it("costo por presentación", () => {
    expect(costPerPresentationLabel("4", 10, "saco", "CUP")).toBe("= 40 CUP por saco");
    expect(costPerPresentationLabel("", 10, "saco", "CUP")).toBe("");
  });
  it("valida el formulario", () => {
    expect(entrySchema.safeParse({ productId: "p", qty: "2,5", unit: "base", unknownCost: false }).success).toBe(true);
    expect(entrySchema.safeParse({ productId: "p", qty: "0", unit: "base", unknownCost: false }).success).toBe(false);
    expect(entrySchema.safeParse({ productId: "p", qty: "1", unit: "base", cost: "x", unknownCost: false }).success).toBe(false);
  });
  it("traduce errores", () => {
    expect(entryErrorMessage("NOT_WAREHOUSE")).toMatch(/almacén/);
    expect(entryErrorMessage("???")).toMatch(/No se pudo/);
  });
});

describe("entryProductOptions", () => {
  const products = [
    { id: "a", name: "Arroz", active: true },
    { id: "b", name: "Boniato", active: true },
    { id: "c", name: "Café", active: false },
  ];
  it("lists storable first, then unconfigured active ones", () => {
    const o = entryProductOptions(products, new Set(["b"]), true);
    expect(o.map((x) => x.value)).toEqual(["b", "a"]);
    expect(o[1].unconfigured).toBe(true);
  });
  it("hides unconfigured products without configure_units", () => {
    expect(entryProductOptions(products, new Set(["b"]), false).map((x) => x.value)).toEqual(["b"]);
  });
});

import { BULK, entryFactor, entrySummary, familyRatio, fromFamilyUnit, newPresentationContent, plural, presentationOptions, quantityLabel, resolveBase, deriveBaseUnit } from "@/components/stock/entry-logic";
import { convertUnits, toNumber } from "@/core/domain/stock";

describe("flujo presentación > cantidad > contenido", () => {
  it("lista presentaciones, granel y nueva", () => {
    const v = (canCreate: boolean) => presentationOptions([{ name: "saco" }], canCreate).map((o) => o.value);
    expect(v(true)).toEqual([BULK, "saco", "new"]);
    expect(v(false)).toEqual([BULK, "saco"]);
  });
  it("etiqueta de cantidad", () => {
    expect(plural("saco")).toBe("sacos");
    expect(plural("caja")).toBe("cajas");
    expect(plural("pan")).toBe("panes");
    expect(quantityLabel("saco", "saco")).toBe("¿Cuántos sacos entran?");
    expect(quantityLabel(BULK, "")).toBe("Cantidad");
  });
  it("convierte dentro de la familia con un solo redondeo", () => {
    expect(toNumber(convertUnits(250, "kg", "lb"))).toBe(551.156);
    expect(fromFamilyUnit("unit:kg", "lb", 12)).toEqual({ qty: 26.455, unitCost: undefined });
    expect(() => fromFamilyUnit("unit:ml", "lb", 1)).toThrow();
    expect(familyRatio("unit:lb", "lb")).toBe(1);
  });
  it("contenido de presentación nueva en milésimas", () => {
    expect(newPresentationContent(25, "kg", "lb")).toBe(55.116);
    expect(entryFactor(false, "kg", "25", "lb")).toBe(55.116);
    expect(entryFactor(false, "kg", "", "lb")).toBe(0);
  });
  it("resumen presentación", () => {
    expect(entrySummary(false, "25", "saco", "10", "lb", "lb")).toBe("25 sacos × 10 lb = 250 lb");
    expect(entrySummary(false, "10", "saco", "25", "kg", "lb")).toBe("10 sacos × 25 kg = 250 kg = 551,160 lb");
    expect(entrySummary(false, "", "saco", "25", "kg", "lb")).toBe("");
    expect(entrySummary(false, "5", "saco", "", "kg", "lb")).toBe("");
  });
  it("resumen granel", () => {
    expect(entrySummary(true, "12", "", "", "kg", "lb")).toBe("12 kg = 26,455 lb");
    expect(entrySummary(true, "12", "", "", "lb", "lb")).toBe("");
  });
  it("unidad base por defecto y familia compatible", () => {
    expect(resolveBase("lb", "kg")).toBe("lb");
    expect(resolveBase(undefined, "kg")).toBe("kg");
    expect(deriveBaseUnit(true, "kg", "lb")).toBe("kg");
    expect(deriveBaseUnit(false, "kg", "lb")).toBe("lb");
    expect(deriveBaseUnit(false, "", "u")).toBe("u");
    expect(deriveBaseUnit(true, "", "")).toBeUndefined();
  });
});
