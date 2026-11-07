import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { ViewState } from "@/components/ui/view-state";
import { supportLine, viewStateCopy } from "@/components/ui/view-state-logic";
import { MoneyValue } from "@/components/ui/money-value";

const CUP = { code: "CUP", decimals: 2 };
const html = (el: React.ReactElement) => renderToStaticMarkup(el);

describe("view-state-logic", () => {
  it("parametrizes copy by entity and permission", () => {
    expect(viewStateCopy("empty", "Productos", undefined).title).toBe("Aún no hay productos");
    expect(viewStateCopy("forbidden", "Existencias", "Existencias · Ver").text).toContain("«Existencias · Ver»");
    expect(supportLine("EXS-503", "15:42")).toBe("Código para soporte: EXS-503 · 15:42");
  });
});

describe("ViewState", () => {
  it("loading is a labelled status", () => {
    const out = html(createElement(ViewState, { kind: "loading", entity: "Existencias" }));
    expect(out).toContain('role="status"');
    expect(out).toContain('aria-label="Cargando existencias"');
  });
  it("empty hides the action without create permission", () => {
    const action = createElement("button", null, "Crear");
    expect(html(createElement(ViewState, { kind: "empty", entity: "X", action }))).toContain("Crear");
    expect(html(createElement(ViewState, { kind: "empty", entity: "X", action, canCreate: false }))).not.toContain("Crear");
  });
  it("error shows the support code and forbidden the permission", () => {
    expect(html(createElement(ViewState, { kind: "error", entity: "Existencias", supportCode: "EXS-503" }))).toContain("EXS-503");
    expect(html(createElement(ViewState, { kind: "forbidden", entity: "Existencias" }))).toContain("No tienes acceso a Existencias");
  });
});

describe("MoneyValue", () => {
  it("formats, flags unknown cost and hides without costs", () => {
    expect(html(createElement(MoneyValue, { value: 12500, currency: CUP }))).toContain("12.500,00 CUP");
    expect(html(createElement(MoneyValue, { value: null, currency: CUP }))).toContain("Sin costo conocido");
    expect(html(createElement(MoneyValue, { value: 0, currency: CUP, costs: false }))).toBe("");
  });
});
