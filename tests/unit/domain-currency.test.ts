import { describe, expect, it } from "vitest";
import {
  validateCurrencyCode,
  validateCurrencySymbol,
  validateDecimals,
  validateDenomination,
} from "@/core/domain/currency";

describe("currency rules", () => {
  it("code: trimmed, 1-10 chars", () => {
    expect(validateCurrencyCode("  MXN ")).toBe("MXN");
    expect(() => validateCurrencyCode("  ")).toThrow();
    expect(() => validateCurrencyCode("12345678901")).toThrow();
  });

  it("symbol: 1-8 chars", () => {
    expect(validateCurrencySymbol("$")).toBe("$");
    expect(() => validateCurrencySymbol("123456789")).toThrow();
  });

  it("decimals: integer 0-4", () => {
    expect(validateDecimals(0)).toBe(0);
    expect(validateDecimals(4)).toBe(4);
    for (const n of [-1, 5, 1.5]) expect(() => validateDecimals(n)).toThrow();
  });

  it("denomination: positive value, bill or coin", () => {
    expect(validateDenomination({ value: 0.5, kind: "coin" })).toEqual({ value: 0.5, kind: "coin" });
    expect(() => validateDenomination({ value: 0, kind: "coin" })).toThrow();
    expect(() => validateDenomination({ value: 5, kind: "note" })).toThrow();
  });
});
