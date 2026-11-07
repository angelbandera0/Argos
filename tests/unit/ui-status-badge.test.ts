import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { STATUS_BADGES, StatusBadge } from "@/components/ui/status-badge";

describe("StatusBadge", () => {
  it("renders label with icon", () => {
    const html = renderToStaticMarkup(createElement(StatusBadge, { family: "stock", status: "out" }));
    expect(html).toContain("Agotado");
    expect(html).toContain("<svg");
    expect(html).toContain("ui-status-out");
  });
  it("uses filled yellow only for open states", () => {
    const open = Object.values(STATUS_BADGES).flatMap((f) => Object.values(f)).filter((d) => d.tone === "open").map((d) => d.label);
    expect(open).toEqual(["Sin atender", "Abierto · en curso"]);
  });
});
