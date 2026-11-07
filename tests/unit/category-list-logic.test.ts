import { describe, expect, it } from "vitest";
import { canDelete, categoriesLabel, filterCategories, isDuplicate, productsLabel, updateNote } from "@/components/catalog/category-list-logic";

const items = [
  { id: "1", name: "Lácteos", count: 2 },
  { id: "2", name: "Congelados", count: 0 },
];

describe("category list logic", () => {
  it("detects duplicates ignoring case and accents, excluding self", () => {
    expect(isDuplicate("  lacteos ", items)).toBe(true);
    expect(isDuplicate("LÁCTEOS", items, "1")).toBe(false);
    expect(isDuplicate("Frutas", items)).toBe(false);
  });
  it("only empty categories can be deleted", () => {
    expect(canDelete(items[0])).toBe(false);
    expect(canDelete(items[1])).toBe(true);
  });
  it("filters by name ignoring accents", () => {
    expect(filterCategories(items, "lact").map((c) => c.id)).toEqual(["1"]);
    expect(filterCategories(items, " ")).toHaveLength(2);
  });
  it("labels", () => {
    expect(productsLabel(0)).toBe("Sin productos");
    expect(productsLabel(1)).toBe("1 producto");
    expect(categoriesLabel(5)).toBe("5 categorías");
    expect(updateNote(3)).toBe("Se actualizará en 3 productos.");
  });
});
