import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { QuantityInput } from "@/components/ui/quantity-input";
import { equivalentLine, exceeds, formatQty, toBase } from "@/components/ui/quantity-logic";

describe("quantity-logic", () => {
  it("converts to base with unit decimals", () => {
    expect(toBase(5, 25, "lb")).toBe(125);
    expect(toBase(3, 0.2, "lb")).toBe(0.6);
    expect(toBase(2, 1.5, "g")).toBe(3);
  });
  it("formats in es with 3 decimals for lb and 0 for g", () => {
    expect(formatQty(125, "lb")).toBe("125,000 lb");
    expect(formatQty(125000, "lb")).toBe("125.000,000 lb");
    expect(formatQty(5000, "g")).toBe("5.000 g");
  });
  it("flags exceeding available", () => {
    expect(exceeds(125, 100)).toBe(true);
    expect(exceeds(100, 100)).toBe(false);
    expect(exceeds(5, undefined)).toBe(false);
    expect(equivalentLine(5, 25, "lb")).toBe("= 125,000 lb");
    expect(equivalentLine(5, 25, "lb", 100)).toBe("Solo hay 100,000 lb");
  });
});

describe("QuantityInput", () => {
  const props = { value: 5, onValueChange: () => {}, presentations: [{ value: "s", label: "sacos de 25 lb", factor: 25 }], presentation: "s", onPresentationChange: () => {}, unit: "lb" as const };
  it("shows the equivalent and marks the error", () => {
    expect(renderToStaticMarkup(createElement(QuantityInput, props))).toContain("= 125,000 lb");
    const html = renderToStaticMarkup(createElement(QuantityInput, { ...props, available: 100 }));
    expect(html).toContain("Solo hay 100,000 lb");
    expect(html).toContain('aria-invalid="true"');
  });
});
