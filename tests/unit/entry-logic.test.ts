import { describe, expect, it } from "vitest";
import { baseAmount, costPerBaseLabel, entryErrorMessage, entrySchema, entryProductOptions, equivalentLabel } from "@/components/stock/entry-logic";

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
  it("costo por base", () => {
    expect(costPerBaseLabel("100", 25, "lb", "CUP")).toContain("4");
    expect(costPerBaseLabel("", 25, "lb", "CUP")).toBe("");
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
