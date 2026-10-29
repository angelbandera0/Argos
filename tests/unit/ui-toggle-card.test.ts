import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { ToggleCard } from "@/components/ui/toggle-card";

describe("ToggleCard", () => {
  it("is a switch reflecting its state", () => {
    const html = renderToStaticMarkup(createElement(ToggleCard, { checked: true, onCheckedChange: () => {}, icon: null, title: "Activo" }));
    expect(html).toContain('role="switch"');
    expect(html).toContain('aria-checked="true"');
  });
});
