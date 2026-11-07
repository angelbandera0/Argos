import { describe, expect, it } from "vitest";
import {
  currencyErrors,
  hasValue,
  parseDenominationValue,
  previewAmount,
  sortDenominations,
} from "@/components/currencies/currency-form-logic";
import { currencyErrorMessage } from "@/components/currencies/currency-list-logic";
import type { Denomination } from "@/core/application/ports/currency-repository";

const den = (id: string, value: number): Denomination => ({ id, companyId: "c", currencyId: "x", value, kind: "bill", active: true });

describe("currency form logic", () => {
  it("validates the draft", () => {
    expect(currencyErrors({ code: "PEN", name: "Sol", symbol: "S/", decimals: "2" })).toEqual({});
    const e = currencyErrors({ code: "", name: " ", symbol: "", decimals: "5" });
    expect(Object.keys(e).sort()).toEqual(["code", "decimals", "name", "symbol"]);
    expect(currencyErrors({ code: "A", name: "B", symbol: "C", decimals: "" }).decimals).toBeDefined();
  });

  it("previews the amount with the decimals", () => {
    expect(previewAmount("S/", "2")).toBe("S/ 1234,50");
    expect(previewAmount("¥", "0")).toMatch(/^¥ 1\s?235$/);
    expect(previewAmount("", "x")).toBe("1234,50");
  });

  it("parses denomination values", () => {
    expect(parseDenominationValue("0,5")).toBe(0.5);
    expect(parseDenominationValue("20")).toBe(20);
    expect(parseDenominationValue("")).toBeNull();
    expect(parseDenominationValue("-1")).toBeNull();
    expect(parseDenominationValue("abc")).toBeNull();
  });

  it("sorts by value and detects duplicates", () => {
    const items = [den("a", 50), den("b", 5), den("c", 20)];
    expect(sortDenominations(items).map((d) => d.value)).toEqual([5, 20, 50]);
    expect(hasValue(items, 20)).toBe(true);
    expect(hasValue(items, 20, "c")).toBe(false);
  });

  it("maps database errors", () => {
    expect(currencyErrorMessage("CODE_TAKEN")).toMatch(/código/);
    expect(currencyErrorMessage("VALUE_TAKEN")).toMatch(/valor/);
  });
});
