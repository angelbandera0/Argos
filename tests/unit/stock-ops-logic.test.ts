import { describe, expect, it } from "vitest";
import { adjustBounds, adjustDeltaError, reasonCode, surplusSchema, writeOffSchema } from "@/components/stock/ops-logic";

describe("ops-logic", () => {
  it("«otro» exige texto", () => {
    const base = { productId: "p", qty: "2", unit: "base", reasonId: "r", requiresText: "true" };
    expect(writeOffSchema.safeParse({ ...base, text: "" }).success).toBe(false);
    expect(writeOffSchema.safeParse({ ...base, text: "rota" }).success).toBe(true);
    expect(writeOffSchema.safeParse({ ...base, requiresText: "false", text: "" }).success).toBe(true);
  });
  it("ajuste restituye hasta la cantidad inicial", () => {
    expect(adjustBounds(10, 4)).toEqual({ maxRestore: 6, maxDiscount: 4 });
    expect(adjustDeltaError(6, 10, 4)).toBeNull();
    expect(adjustDeltaError(6.5, 10, 4)).not.toBeNull();
    expect(adjustDeltaError(-5, 10, 4)).not.toBeNull();
    expect(adjustDeltaError(0, 10, 4)).not.toBeNull();
  });
  it("sobrante: costo opcional", () => {
    expect(surplusSchema.safeParse({ productId: "p", qty: "1,5", text: "x", unitCost: "" }).success).toBe(true);
    expect(surplusSchema.safeParse({ productId: "p", qty: "0", text: "x" }).success).toBe(false);
  });
  it("código del motivo", () => {
    expect(reasonCode("Caducó el lote!")).toBe("caduco_el_lote");
    expect(reasonCode("1 daño")).toBe("m_1_dano");
  });
});
