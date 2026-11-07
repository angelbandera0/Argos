import { describe, expect, it } from "vitest";
import { add, compare, convertFromBase, convertToBase, div, format, isNegative, isZero, mul, qty, sub, toNumber, unitsOf, BASE_UNIT } from "@/core/domain/stock";

const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as { code?: string }).code;
  }
};

describe("Qty", () => {
  it("0.1 + 0.2 === 0.3 exact", () => {
    expect(add(qty(0.1), qty(0.2))).toBe(qty(0.3));
    expect(toNumber(add(qty(0.1), qty(0.2)))).toBe(0.3);
  });
  it("parses strings with comma", () => {
    expect(qty("24,6")).toBe(qty(24.6));
    expect(code(() => qty(""))).toBe("INVALID_QUANTITY");
    expect(code(() => qty("abc"))).toBe("INVALID_QUANTITY");
    expect(code(() => qty(NaN))).toBe("INVALID_QUANTITY");
  });
  it("rejects negatives unless signed", () => {
    expect(code(() => qty(-1))).toBe("NEGATIVE_QUANTITY");
    expect(isNegative(qty(-1, true))).toBe(true);
    expect(code(() => sub(qty(1), qty(2)))).toBe("NEGATIVE_QUANTITY");
    expect(sub(qty(1), qty(2), true)).toBe(qty(-1, true));
  });
  it("rounds half-up to 3 decimals", () => {
    expect(toNumber(qty(1.0005))).toBe(1.001);
    expect(toNumber(qty(1.0004))).toBe(1);
    expect(toNumber(mul(qty(1), 0.3335))).toBe(0.334);
    expect(toNumber(mul(qty(5), 25))).toBe(125);
    expect(toNumber(div(qty(1), qty(0.333)))).toBe(3.003);
    expect(code(() => div(qty(1), qty(0)))).toBe("INVALID_QUANTITY");
  });
  it("compare / isZero", () => {
    expect(compare(qty(1), qty(2))).toBe(-1);
    expect(compare(qty(2), qty(2))).toBe(0);
    expect(compare(qty(3), qty(2))).toBe(1);
    expect(isZero(qty(0))).toBe(true);
  });
  it("format es", () => {
    expect(format(qty(125))).toBe("125,000");
    expect(format(qty(125000))).toBe("125.000,000");
    expect(format(qty(0.2))).toBe("0,200");
  });
});

describe("units", () => {
  it("default bases and convertible units", () => {
    expect(BASE_UNIT).toEqual({ weight: "lb", volume: "l", count: "u" });
    expect(unitsOf("weight")).toEqual(["lb", "kg", "g", "oz"]);
    expect(unitsOf("volume")).toEqual(["l", "ml"]);
    expect(unitsOf("count")).toEqual(["u"]);
  });
  it("kg <-> lb with 0.45359237", () => {
    expect(toNumber(convertToBase(1, "kg"))).toBe(2.205);
    expect(toNumber(convertToBase(10, "kg"))).toBe(22.046);
    expect(toNumber(convertFromBase(qty(1), "kg"))).toBe(0.454);
    expect(toNumber(convertFromBase(qty(100), "kg"))).toBe(45.359);
    expect(toNumber(convertToBase(16, "oz"))).toBe(1);
    expect(toNumber(convertToBase(500, "ml"))).toBe(0.5);
    expect(toNumber(convertToBase(453.59237, "g"))).toBe(1);
    expect(convertToBase(7, "lb")).toBe(qty(7));
  });
  it("rejects mixing magnitudes", () => {
    expect(code(() => convertToBase(1, "kg", "volume"))).toBe("UNIT_MAGNITUDE_MISMATCH");
    expect(code(() => convertFromBase(qty(1), "ml", "weight"))).toBe("UNIT_MAGNITUDE_MISMATCH");
    expect(convertToBase(1, "l", "volume")).toBe(qty(1));
  });
});
