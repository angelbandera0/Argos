import { describe, expect, it } from "vitest";
import {
  activeParam,
  currencyErrorMessage,
  denominationsLabel,
  formatAmount,
  parseStatusFilter,
} from "@/components/currencies/currency-list-logic";

describe("currency list logic", () => {
  it("parses the status filter", () => {
    expect(parseStatusFilter("activas")).toBe("activas");
    expect(parseStatusFilter("inactivas")).toBe("inactivas");
    expect(parseStatusFilter("x")).toBe("");
    expect(parseStatusFilter(undefined)).toBe("");
  });
  it("maps the filter to the active flag", () => {
    expect(activeParam("")).toBeUndefined();
    expect(activeParam("activas")).toBe(true);
    expect(activeParam("inactivas")).toBe(false);
  });
  it("formats amounts by decimals", () => {
    expect(formatAmount(1234.5, 2)).toBe("1234,50");
    expect(formatAmount(15000, 0)).toBe("15.000");
  });
  it("labels denominations", () => {
    expect(denominationsLabel(0)).toBe("Ninguna");
    expect(denominationsLabel(1)).toBe("1 denominación");
    expect(denominationsLabel(3)).toBe("3 denominaciones");
  });
  it("explains CURRENCY_IN_USE", () => {
    expect(currencyErrorMessage("CURRENCY_IN_USE")).toContain("no se puede eliminar");
    expect(currencyErrorMessage(undefined)).toContain("No se pudo");
  });
});
