import { describe, expect, it } from "vitest";
import {
  bulkSummary,
  matchesQuery,
  matchesStatus,
  parseStatusParam,
  productListQuery,
  selectedLabel,
  statusCounts,
} from "@/components/catalog/product-list-logic";

describe("product list logic", () => {
  it("parses status incl. legacy values", () => {
    expect(parseStatusParam("activo")).toBe("activos");
    expect(parseStatusParam("inactivos")).toBe("inactivos");
    expect(parseStatusParam("x")).toBe("todos");
  });
  it("filters and counts", () => {
    const items = [{ active: true }, { active: true }, { active: false }];
    expect(statusCounts(items)).toEqual({ todos: 3, activos: 2, inactivos: 1 });
    expect(matchesStatus("activos", true)).toBe(true);
    expect(matchesStatus("inactivos", true)).toBe(false);
    expect(matchesStatus("todos", false)).toBe(true);
  });
  it("searches name and description", () => {
    expect(matchesQuery({ name: "Malanga", description: "Por libra" }, "LIBRA")).toBe(true);
    expect(matchesQuery({ name: "Malanga", description: null }, "yuca")).toBe(false);
    expect(matchesQuery({ name: "Malanga", description: null }, "  ")).toBe(true);
  });
  it("builds the query string", () => {
    expect(productListQuery({})).toBe("");
    expect(productListQuery({ q: "a", categoria: "c1", estado: "activos", pagina: 2 })).toBe("?q=a&categoria=c1&estado=activos&pagina=2");
  });
  it("labels", () => {
    expect(selectedLabel(1)).toBe("1 producto seleccionado");
    expect(selectedLabel(2)).toBe("2 productos seleccionados");
    expect(bulkSummary(2, 1)).toBe("2 productos actualizados; 1 no se pudieron actualizar.");
  });
});
