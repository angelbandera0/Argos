import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { SpendSummary } from "@/components/ui/spend-summary";
import { barPercent, formatMoney, surplus } from "@/components/ui/spend-logic";

const CUP = { code: "CUP", decimals: 2 };

describe("spend-logic", () => {
  it("formats money by currency decimals", () => {
    expect(formatMoney(12500, CUP)).toBe("12.500,00 CUP");
    expect(formatMoney(3400, CUP, true)).toBe("+3.400,00 CUP");
    expect(formatMoney(-450, CUP, true)).toBe("−450,00 CUP");
    expect(formatMoney(1200, { code: "JPY", decimals: 0 })).toBe("1.200 JPY");
  });
  it("computes surplus and bar share", () => {
    expect(surplus(20000, 16600, CUP)).toBe(3400);
    expect(surplus(0.3, 0.1, CUP)).toBe(0.2);
    expect(barPercent(50, 200)).toBe(25);
    expect(barPercent(5, 0)).toBe(0);
  });
});

describe("SpendSummary", () => {
  it("shows Sobrante when positive and Excedido when negative", () => {
    expect(renderToStaticMarkup(createElement(SpendSummary, { delivered: 20000, spent: 16600, currency: CUP }))).toContain("Sobrante");
    const over = renderToStaticMarkup(createElement(SpendSummary, { delivered: 8000, spent: 8450, currency: CUP }));
    expect(over).toContain("Excedido");
    expect(over).toContain("−450,00 CUP");
  });
  it("renders nothing with hideAmounts", () => {
    expect(renderToStaticMarkup(createElement(SpendSummary, { delivered: 1, spent: 1, currency: CUP, hideAmounts: true }))).toBe("");
  });
});
