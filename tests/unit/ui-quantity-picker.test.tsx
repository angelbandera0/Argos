import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QuantityPicker } from "@/components/ui/quantity-picker";

const base = { id: "q", name: "qty", unitName: "unit", value: "5", unit: "base", units: [{ value: "base", label: "lb" }], onValueChange: () => {}, onUnitChange: () => {} };

describe("QuantityPicker", () => {
  it("muestra el equivalente", () => {
    expect(renderToStaticMarkup(<QuantityPicker {...base} equivalent="= 125,000 lb" />)).toContain("= 125,000 lb");
  });
  it("el error sustituye al equivalente", () => {
    const html = renderToStaticMarkup(<QuantityPicker {...base} equivalent="= 1 lb" error="Solo hay 1 lb" />);
    expect(html).toContain("Solo hay 1 lb");
    expect(html).not.toContain("= 1 lb");
  });
});
