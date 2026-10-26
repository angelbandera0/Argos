import { describe, expect, it } from "vitest";
import {
  ariaSort,
  nextSort,
  pageCount,
  pageItems,
  pageSlice,
  rangeLabel,
  selectionState,
  sortRows,
  toggleRow,
  togglePage,
} from "@/components/ui/data-table-utils";
import { collapseCrumbs, isActivePath, stepState } from "@/components/ui/nav-utils";

describe("orden", () => {
  it("alterna asc, desc y sin orden; cambiar de columna reinicia", () => {
    const a = nextSort(null, "x");
    expect(a).toEqual({ id: "x", dir: "asc" });
    expect(nextSort(a, "x")).toEqual({ id: "x", dir: "desc" });
    expect(nextSort({ id: "x", dir: "desc" }, "x")).toBeNull();
    expect(nextSort(a, "y")).toEqual({ id: "y", dir: "asc" });
  });
  it("ordena números y texto en español, estable y con vacíos al final", () => {
    const rows = [{ n: "b", v: 2 }, { n: "á", v: null }, { n: "a", v: 10 }, { n: "c", v: 2 }];
    expect(sortRows(rows, (r) => r.v, "asc").map((r) => r.n)).toEqual(["b", "c", "a", "á"]);
    expect(sortRows(rows, (r) => r.v, "desc").map((r) => r.n)).toEqual(["a", "b", "c", "á"]);
    expect(sortRows(rows, (r) => r.n, "asc").map((r) => r.n)).toEqual(["a", "á", "b", "c"]);
  });
  it("aria-sort", () => {
    expect(ariaSort({ id: "x", dir: "desc" }, "x")).toBe("descending");
    expect(ariaSort({ id: "x", dir: "asc" }, "y")).toBe("none");
  });
});

describe("paginación", () => {
  it("calcula páginas, corte y rango", () => {
    expect(pageCount(0, 8)).toBe(1);
    expect(pageCount(14, 8)).toBe(2);
    expect(pageSlice([1, 2, 3, 4, 5], 2, 2)).toEqual([3, 4]);
    expect(rangeLabel(2, 8, 14)).toBe("9–14 de 14");
    expect(rangeLabel(1, 8, 0)).toBe("0 de 0");
  });
  it("elementos con saltos", () => {
    expect(pageItems(1, 3)).toEqual([1, 2, 3]);
    expect(pageItems(5, 10)).toEqual([1, "gap", 4, 5, 6, "gap", 10]);
    expect(pageItems(2, 10)).toEqual([1, 2, 3, "gap", 10]);
  });
});

describe("selección", () => {
  it("estado de la página y alternancias que conservan otras páginas", () => {
    const sel = new Set(["z"]);
    expect(selectionState(["a", "b"], sel)).toBe("none");
    expect(selectionState(["a", "b"], new Set(["a"]))).toBe("some");
    const all = togglePage(sel, ["a", "b"]);
    expect([...all].sort()).toEqual(["a", "b", "z"]);
    expect(selectionState(["a", "b"], all)).toBe("all");
    expect([...togglePage(all, ["a", "b"])]).toEqual(["z"]);
    expect([...toggleRow(sel, "z")]).toEqual([]);
  });
});

describe("pasos y migas", () => {
  it("estado de cada paso", () => {
    expect([0, 1, 2, 3].map((i) => stepState(i, 1, 3))).toEqual(["complete", "current", "pending", "error"]);
    expect(stepState(1, 1, 1)).toBe("error");
  });
  it("colapsa con más de 4 niveles", () => {
    const c = (n: number) => Array.from({ length: n }, (_, i) => ({ label: String(i) }));
    expect(collapseCrumbs(c(4)).hidden).toHaveLength(0);
    const r = collapseCrumbs(c(6));
    expect([r.head, r.hidden, r.tail].map((x) => x.map((y) => y.label).join())).toEqual(["0", "1,2,3", "4,5"]);
  });
  it("ruta activa", () => {
    expect(isActivePath("/roles/1", "/roles")).toBe(true);
    expect(isActivePath("/rolesx", "/roles")).toBe(false);
    expect(isActivePath("/roles", "/")).toBe(false);
  });
});
