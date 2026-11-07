import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SummaryPanel } from "@/components/ui/summary-panel";

describe("SummaryPanel", () => {
  it("shows the placeholder when there is no title", () => {
    expect(renderToStaticMarkup(SummaryPanel({ icon: "KeyRound", title: "", placeholder: "Sin nombre" }))).toContain("Sin nombre");
  });
});
