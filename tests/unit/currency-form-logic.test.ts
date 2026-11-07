import { describe, expect, it } from "vitest";
import {
  activeSummary,
  addLocalDenomination,
  applyDefault,
  decimalOptions,
  parseDenominationsJson,
  removeLocalDenomination,
  serializeDenominations,
  toggleLocalDenomination,
  currencyErrors,
  hasValue,
  parseDenominationValue,
  moneyExamples,
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
    expect(previewAmount("S/", "2")).toBe("S/ 1.234,50");
    expect(previewAmount("¥", "0")).toBe("¥ 1.235");
    expect(previewAmount("", "x")).toBe("1.234,50");
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
    expect(sortDenominations(items).map((d) => d.value)).toEqual([50, 20, 5]);
    expect(hasValue(items, 20)).toBe(true);
    expect(hasValue(items, 20, "c")).toBe(false);
  });

  it("maps database errors", () => {
    expect(currencyErrorMessage("CODE_TAKEN")).toMatch(/código/);
    expect(currencyErrorMessage("VALUE_TAKEN")).toMatch(/valor/);
  });
});

describe("money examples", () => {
  it("formats by decimals and code", () => {
    expect(moneyExamples("CUP ", "2").map((x) => x.value)).toEqual(["12.500,00", "32,00", "0,50", "1.234,50 CUP"]);
    expect(moneyExamples("JPY", "0")[3].value).toBe("1.235 JPY");
  });
  it("sorts denominations from highest to lowest", () => {
    expect(sortDenominations([den("a", 1), den("b", 20), den("c", 5)]).map((d) => d.id)).toEqual(["b", "c", "a"]);
  });
});

describe("currency form: accumulated denominations and rules", () => {
  it("accumulates drafts, rejects invalid and repeated values", () => {
    const a = addLocalDenomination([], "0,5", "coin", "a");
    expect("items" in a && a.items[0]).toMatchObject({ value: 0.5, kind: "coin", active: true });
    const items = "items" in a ? a.items : [];
    expect(addLocalDenomination(items, "0.5", "bill", "b")).toEqual({ error: "Ya existe una denominación con ese valor." });
    expect(addLocalDenomination(items, "0", "bill", "b")).toEqual({ error: "Escribe un valor mayor que 0." });
  });

  it("counts active of total and serializes from highest to lowest", () => {
    const items = [den("1", 5), den("2", 100), { ...den("3", 20), active: false }];
    expect(activeSummary(items)).toBe("2 activas de 3");
    expect(JSON.parse(serializeDenominations(items)).map((d: { value: number }) => d.value)).toEqual([100, 20, 5]);
    expect(toggleLocalDenomination(items, "1", false)[0].active).toBe(false);
    expect(removeLocalDenomination(items, "1")).toHaveLength(2);
  });

  it("parses the JSON sent to the server action defensively", () => {
    expect(parseDenominationsJson('[{"value":5,"kind":"bill"},{"x":1}]')).toEqual([{ value: 5, kind: "bill", active: true }]);
    expect(parseDenominationsJson("nope")).toEqual([]);
  });

  it("making a currency default activates it; decimals offer 0/2/3 plus the stored value", () => {
    expect(applyDefault(true, false)).toEqual({ isDefault: true, active: true });
    expect(applyDefault(false, false)).toEqual({ isDefault: false, active: false });
    expect(decimalOptions(2).map((o) => o.value)).toEqual(["0", "2", "3"]);
    expect(decimalOptions(4).map((o) => o.value)).toEqual(["0", "2", "3", "4"]);
  });
});
