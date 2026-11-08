import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { progressPercent } from "@/components/ui/progress-logic";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";
import { LoadingStatus } from "@/components/ui/loading-status";

describe("progressPercent", () => {
  it("acota y redondea", () => {
    expect(progressPercent(64)).toBe(64);
    expect(progressPercent(150)).toBe(100);
    expect(progressPercent(-3)).toBe(0);
    expect(progressPercent(1, 3)).toBe(33);
    expect(progressPercent(NaN)).toBe(0);
    expect(progressPercent(5, 0)).toBe(0);
  });
});

describe("ProgressBar", () => {
  it("expone role=progressbar accesible", () => {
    const html = renderToStaticMarkup(createElement(ProgressBar, { value: 64, label: "Sync" }));
    expect(html).toContain('role="progressbar"');
    expect(html).toContain('aria-valuenow="64"');
    expect(html).toContain("64%");
  });
});

describe("Button loadingLabel", () => {
  const render = (loading: boolean) => renderToStaticMarkup(createElement(Button, { loading, loadingLabel: "Guardando…" }, "Guardar"));
  it("reserva el ancho renderizando ambas etiquetas", () => {
    for (const l of [false, true]) {
      const html = render(l);
      expect(html).toContain("Guardar");
      expect(html).toContain("Guardando…");
    }
  });
  it("en carga: aria-busy, disabled y oculta la etiqueta normal", () => {
    const html = render(true);
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("disabled");
    expect(html).toMatch(/btn-swap-off" aria-hidden="true">Guardar</);
  });
  it("sin loadingLabel conserva el texto", () => {
    expect(renderToStaticMarkup(createElement(Button, { loading: true }, "Guardar"))).not.toContain("btn-swap");
  });
});

describe("LoadingStatus", () => {
  it("role=status con texto", () => {
    const html = renderToStaticMarkup(createElement(LoadingStatus, null, "Cargando pedidos…"));
    expect(html).toContain('role="status"');
    expect(html).toContain("Cargando pedidos…");
  });
});
