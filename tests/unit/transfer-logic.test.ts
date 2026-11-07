import { describe, expect, it } from "vitest";
import { allocationValue, transferLinesSchema, pendingBase, picksFrom, picksTotal, suggestedValues, transferErrorMessage, transferSchema } from "@/components/stock/transfer-logic";

describe("transfer-logic", () => {
  it("convierte lo tecleado en picks", () => {
    expect(picksFrom({ a: "2,5", b: "", c: "0", d: "-1", e: "1" })).toEqual([{ lotId: "a", qty: 2.5 }, { lotId: "e", qty: 1 }]);
  });
  it("suma en milésimas exactas", () => {
    expect(picksTotal([{ lotId: "a", qty: 0.1 }, { lotId: "b", qty: 0.2 }])).toBe(300);
    expect(pendingBase([{ lotId: "a", qty: 0.1 }, { lotId: "b", qty: 0.2 }], 0.3)).toBe(0);
    expect(pendingBase([{ lotId: "a", qty: 1 }], 3)).toBe(2);
    expect(pendingBase([{ lotId: "a", qty: 4 }], 3)).toBe(-1);
  });
  it("sugeridos como valores de formulario", () => {
    expect(suggestedValues([{ lotId: "a", qty: 1.5 }])).toEqual({ a: "1.5" });
  });
  it("valida el formulario", () => {
    const ok = transferSchema.safeParse({ productId: "p", toLocationId: "t", qty: "2,5", unit: "base", picks: '[{"lotId":"a","qty":2.5}]', reason: "" });
    expect(ok.success && ok.data.picks).toEqual([{ lotId: "a", qty: 2.5 }]);
    expect(transferSchema.safeParse({ productId: "p", toLocationId: "", qty: "1", unit: "base" }).success).toBe(false);
    expect(transferSchema.safeParse({ productId: "p", toLocationId: "t", qty: "1", unit: "base", picks: "no-json" }).success).toBe(false);
  });
  it("traduce errores", () => {
    expect(transferErrorMessage("CHOOSE_LOT_FORBIDDEN")).toContain("permiso");
    expect(transferErrorMessage("X")).toContain("No se pudo");
  });
  it("valor trasladado por divisa; null sin costos", () => {
    const lots = [
      { id: "a", receivedAt: "", remaining: 5, unitCost: { amount: 2, currencyId: "usd" } },
      { id: "b", receivedAt: "", remaining: 5, unitCost: null },
    ];
    expect(allocationValue(lots, [{ lotId: "a", qty: 3 }, { lotId: "b", qty: 1 }])).toEqual({ byCurrency: [{ currencyId: "usd", amount: 6 }], unknown: true });
    expect(allocationValue([{ id: "a", receivedAt: "", remaining: 1 }], [{ lotId: "a", qty: 1 }])).toBeNull();
  });
  it("valida un traslado de varias líneas", () => {
    const line = { productId: "p", qty: 2, unit: "base" };
    const ok = transferLinesSchema.safeParse({ toLocationId: "t", lines: JSON.stringify([line, { ...line, productId: "q", picks: [{ lotId: "a", qty: 2 }] }]) });
    expect(ok.success && ok.data.lines).toHaveLength(2);
    expect(transferLinesSchema.safeParse({ toLocationId: "t", lines: "[]" }).success).toBe(false);
    expect(transferLinesSchema.safeParse({ toLocationId: "t", lines: JSON.stringify([{ ...line, qty: 0 }]) }).success).toBe(false);
  });
});
