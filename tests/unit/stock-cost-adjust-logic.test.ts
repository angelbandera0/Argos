import { describe, expect, it } from "vitest";
import { canCorrectLotCost, costAdjustSchema, costInputError, costSummary } from "@/components/stock/cost-adjust-logic";

describe("cost adjust logic (L8)", () => {
  it("validates the typed cost: up to 6 decimals, never negative, empty is not an error yet", () => {
    expect(costInputError("")).toBeNull();
    expect(costInputError("15,5")).toBeNull();
    expect(costInputError("0.123456")).toBeNull();
    expect(costInputError("0.1234567")).toMatch(/6 decimales/);
    expect(costInputError("-1")).toMatch(/válido/);
    expect(costInputError("abc")).toMatch(/válido/);
  });

  it("summarises «De X a Y» only for a valid value", () => {
    expect(costSummary(12, "15", "DOP")).toMatch(/^De .*12.* a .*15/);
    expect(costSummary(12, "", "DOP")).toBeNull();
    expect(costSummary(12, "-3", "DOP")).toBeNull();
  });

  it("parses the form and never invents a cost", () => {
    expect(costAdjustSchema.safeParse({ lotId: "l1", newUnitCost: "15,25", text: "error de compra" }).data).toMatchObject({ newUnitCost: 15.25 });
    expect(costAdjustSchema.safeParse({ lotId: "l1", newUnitCost: "", text: "error de compra" }).success).toBe(false);
    expect(costAdjustSchema.safeParse({ lotId: "l1", newUnitCost: "1", text: "  " }).success).toBe(false);
    expect(costAdjustSchema.safeParse({ lotId: "l1", newUnitCost: "1.1234567", text: "motivo" }).success).toBe(false);
  });

  it("a lot without a known cost cannot be corrected", () => {
    expect(canCorrectLotCost(null)).toBe(false);
    expect(canCorrectLotCost(undefined)).toBe(false);
    expect(canCorrectLotCost(0)).toBe(true);
  });
});
