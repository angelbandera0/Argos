import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { StateTimeline } from "@/components/ui/state-timeline";

describe("StateTimeline", () => {
  const steps = [
    { title: "Creado", state: "done" as const, meta: "Admin · 3 nov" },
    { title: "Devuelto", state: "returned" as const, note: "Faltan 2" },
    { title: "En curso", state: "now" as const },
  ];
  it("marks the current step and shows notes only in vertical", () => {
    const h = renderToStaticMarkup(createElement(StateTimeline, { steps }));
    expect(h).toContain('aria-current="step"');
    expect(h).toContain("ui-timeline-done");
    expect(h).not.toContain("Faltan 2");
    expect(renderToStaticMarkup(createElement(StateTimeline, { steps, orientation: "vertical" }))).toContain("“Faltan 2”");
  });
});
