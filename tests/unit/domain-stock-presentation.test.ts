import { describe, expect, it } from "vitest";
import { baseToMovementUnits, capture, lineTotal, qty, toNumber, unitCostPerBase } from "@/core/domain/stock";

const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as { code?: string }).code;
  }
};

describe("capture / cost", () => {
  const sack = { name: "saco", content: qty(25) };
  it("CA-01: 5 sacks of 25 lb at 300 -> 125,000 lb at 12,000/lb", () => {
    const r = capture(qty(5), sack);
    expect(r.base).toBe(qty(125));
    expect(r.captured).toEqual({ qty: qty(5), unitName: "saco" });
    expect(r.content).toBe(qty(25));
    expect(unitCostPerBase(300, r.content)).toBe(12);
    expect(lineTotal(r.base, 12)).toBe(1500);
  });
  it("S-05: corrected content is frozen (24,6 lb)", () => {
    const r = capture(qty(5), sack, qty("24,6"));
    expect(r.base).toBe(qty(123));
    expect(r.content).toBe(qty(24.6));
    expect(unitCostPerBase(300, r.content)).toBe(12.195122);
  });
  it("CA-02: 10 portions of 0,200 lb -> 2,000 lb and inverse", () => {
    const portion = { name: "porción", equivalence: qty(0.2) };
    expect(capture(qty(10), portion).base).toBe(qty(2));
    expect(baseToMovementUnits(qty(2), portion)).toBe(qty(10));
  });
  it("M2-Q06: 1 lb = 3 portions rounds; effect visible", () => {
    const portion = { name: "porción", equivalence: qty(1 / 3) };
    expect(portion.equivalence).toBe(qty(0.333));
    expect(toNumber(baseToMovementUnits(qty(1), portion))).toBe(3.003);
    expect(toNumber(capture(qty(3), portion).base)).toBe(0.999);
  });
  it("validates content / equivalence > 0", () => {
    expect(code(() => capture(qty(1), { name: "x", content: qty(0) }))).toBe("INVALID_CONTENT");
    expect(code(() => capture(qty(1), sack, qty(0)))).toBe("INVALID_CONTENT");
    expect(code(() => baseToMovementUnits(qty(1), { name: "x", equivalence: qty(0) }))).toBe("INVALID_CONTENT");
    expect(code(() => unitCostPerBase(1, qty(0)))).toBe("INVALID_INPUT");
    expect(code(() => unitCostPerBase(-1, qty(1)))).toBe("INVALID_INPUT");
  });
  it("cost rounds half-up to 6 decimals", () => {
    expect(unitCostPerBase(1, qty(3))).toBe(0.333333);
    expect(unitCostPerBase(2, qty(3))).toBe(0.666667);
    expect(lineTotal(qty(2), 0.333333)).toBe(0.666666);
  });
});
