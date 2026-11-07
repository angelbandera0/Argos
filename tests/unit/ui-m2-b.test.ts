import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { coverage, coverageLabel } from "@/components/ui/coverage-logic";
import { decisionsSummary } from "@/components/ui/decisions-logic";
import { splitStatus } from "@/components/ui/split-logic";
import { diffOf } from "@/components/ui/diff-logic";
import { StockCoverage } from "@/components/ui/stock-coverage";
import { DecisionsBar } from "@/components/ui/decisions-bar";
import { StoreSplit } from "@/components/ui/store-split";
import { ThreeQtyTable } from "@/components/ui/three-qty-table";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ToggleCard } from "@/components/ui/toggle-card";
import { Badge } from "@/components/ui/badge";

const SACO = { one: "saco", many: "sacos" };
const noop = () => {};
const html = <P extends object>(c: (p: P) => React.ReactNode, props: P, ...children: React.ReactNode[]) =>
  renderToStaticMarkup(createElement(c as React.FunctionComponent<P>, props, ...children));

describe("logic", () => {
  it("coverage", () => {
    expect(coverage(20, 12).state).toBe("full");
    expect(coverage(8, 20)).toEqual({ state: "part", ratio: 0.4 });
    expect(coverage(0, 5).state).toBe("none");
    expect(coverageLabel(coverage(8, 20), 8, "lb")).toBe("Cubre 8,000 lb");
  });
  it("decisions summary", () => {
    expect(decisionsSummary({ transfers: 3, purchases: 1, rejections: 1 })).toBe("5 decisiones listas · 3 traslados · 1 por comprar · 1 rechazo");
  });
  it("split status", () => {
    expect(splitStatus(2, [1, 1])).toMatchObject({ ok: true, label: "Cuadra: 2 de 2" });
    expect(splitStatus(2, [1, 0]).label).toBe("Faltan 1 por repartir");
    expect(splitStatus(2, [2, 1]).label).toBe("Sobran 1");
    expect(splitStatus(0.3, [0.1, 0.2]).ok).toBe(true);
  });
  it("diffOf", () => {
    expect(diffOf(5, 5, SACO).label).toBe("Coincide");
    expect(diffOf(4, 5, SACO).label).toBe("−1 saco");
    expect(diffOf(7, 5, SACO).label).toBe("+2 sacos");
    expect(diffOf(0, 0, SACO, true).kind).toBe("missing");
  });
});

describe("components", () => {
  it("StockCoverage", () => {
    expect(html(StockCoverage, { stock: 0, needed: 5, unit: "lb" })).toContain("Sin existencia");
  });
  it("DecisionsBar renders nothing when empty", () => {
    expect(html(DecisionsBar, { decisions: { transfers: 0, purchases: 0, rejections: 0 }, onUndo: noop, onApply: noop })).toBe("");
    const h = html(DecisionsBar, { decisions: { transfers: 1, purchases: 0, rejections: 0 }, onUndo: noop, onApply: noop });
    expect(h).toContain("Deshacer todo");
    expect(h).toContain("Aplicar");
  });
  it("StoreSplit flags mismatch", () => {
    const h = html(StoreSplit, { stores: [{ id: "a", name: "A" }], total: 2, values: { a: 1 }, onValuesChange: noop });
    expect(h).toContain("Faltan 1 por repartir");
    expect(h).toContain('aria-invalid="true"');
  });
  it("ThreeQtyTable hides costs by default", () => {
    const rows = [{ id: "1", name: "Arroz", unit: SACO, ordered: 5, reported: 5, received: 4, cost: "9 CUP" }];
    const without = html(ThreeQtyTable, { rows });
    expect(without).not.toContain("Costo");
    expect(without).toContain("−1 saco");
    expect(without).toContain("data-diff");
    expect(html(ThreeQtyTable, { rows, showCosts: true })).toContain("9 CUP");
  });
  it("SegmentedControl", () => {
    expect(html(SegmentedControl, { "aria-label": "D", options: [{ value: "0", label: "0" }], value: "0" })).toContain('role="radio"');
  });
  it("ToggleCard delicate and locked; Badge icon", () => {
    const h = html(ToggleCard, { checked: true, onCheckedChange: noop, icon: null, title: "Ver costos", tone: "delicate", locked: true });
    expect(h).toContain('data-tone="delicate"');
    expect(h).toContain("Bloqueado");
    expect(html(Badge, { icon: "★" }, "X")).not.toContain("badge-dot");
  });
});
