import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { SalesPreview } from "@/components/ui/sales-preview";

describe("SalesPreview", () => {
  it("shows the category or «Pausado»", () => {
    expect(renderToStaticMarkup(createElement(SalesPreview, { category: "Viandas", name: "Ñame" }))).toContain("Viandas");
    expect(renderToStaticMarkup(createElement(SalesPreview, { category: "Viandas", name: "Ñame", paused: true }))).toContain("Pausado");
  });
});
