import { describe, expect, it } from "vitest";
import { Forbidden, NotFound, RuleViolation, SessionExpired } from "@/core/domain/errors";
import { admin, operator, seeded, setup, superadmin, T0 } from "./catalog-setup";

async function rule(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    expect(e).toBeInstanceOf(RuleViolation);
    return (e as RuleViolation).code;
  }
  throw new Error("did not throw");
}

describe("categories", () => {
  it("CA-01: an admin creates a category visible to the whole company", async () => {
    const s = setup();
    const c = await s.createCategory(admin("a1"), { companyId: "c1", name: "  Bebidas  " });
    expect(c).toEqual({ id: "cat1", companyId: "c1", name: "Bebidas" });
    expect(await s.listCategories(operator("u-view"))).toEqual([c]);
    expect(await s.listCategories(operator("u-all"))).toEqual([c]);
  });

  it("CA-01: an admin without access to the company is Forbidden and nothing is created", async () => {
    const s = setup();
    await expect(s.createCategory(admin("a2"), { companyId: "c1", name: "X" })).rejects.toBeInstanceOf(Forbidden);
    await expect(s.createCategory(admin("a1"), { name: "X" })).rejects.toBeInstanceOf(Forbidden);
    await expect(s.createCategory(superadmin, { companyId: "c1", name: "X" })).rejects.toBeInstanceOf(Forbidden);
    expect(s.catalog.categories.size).toBe(0);
  });

  it("CA-02: an operator with every permission cannot create, rename or delete categories", async () => {
    const s = await seeded();
    const before = s.catalog.snapshot();
    const op = operator("u-all");
    await expect(s.createCategory(op, { name: "Nueva" })).rejects.toBeInstanceOf(Forbidden);
    await expect(s.createCategory(op, { companyId: "c1", name: "Nueva" })).rejects.toBeInstanceOf(Forbidden);
    await expect(s.renameCategory(op, { id: s.category.id, name: "Otra" })).rejects.toBeInstanceOf(Forbidden);
    await expect(s.deleteCategory(op, { id: s.category.id })).rejects.toBeInstanceOf(Forbidden);
    expect(s.catalog.snapshot()).toBe(before);
  });

  it("an operator without view cannot list categories", async () => {
    const s = await seeded();
    await expect(s.listCategories(operator("u-none"))).rejects.toBeInstanceOf(Forbidden);
  });

  it("an admin renames a category and others in other companies cannot", async () => {
    const s = await seeded();
    await s.renameCategory(admin("a1"), { id: s.category.id, name: " Jugos  frescos " });
    expect(s.catalog.categories.get(s.category.id)?.name).toBe("Jugos frescos");
    await expect(s.renameCategory(admin("a2"), { id: s.category.id, name: "Hack" })).rejects.toBeInstanceOf(Forbidden);
    expect(s.catalog.categories.get(s.category.id)?.name).toBe("Jugos frescos");
    await expect(s.renameCategory(admin("a1"), { id: "nope", name: "X" })).rejects.toBeInstanceOf(NotFound);
  });

  it("CA-11: category names collide ignoring case and spacing, excluding itself on rename", async () => {
    const s = await seeded();
    for (const name of ["bebidas", " BEBIDAS ", "Bebidas"]) {
      expect(await rule(s.createCategory(admin("a1"), { companyId: "c1", name }))).toBe("NAME_TAKEN");
    }
    const other = await s.createCategory(admin("a1"), { companyId: "c1", name: "Lácteos" });
    expect(await rule(s.renameCategory(admin("a1"), { id: other.id, name: "bebidas" }))).toBe("NAME_TAKEN");
    await s.renameCategory(admin("a1"), { id: s.category.id, name: "BEBIDAS" });
    expect(s.catalog.categories.get(s.category.id)?.name).toBe("BEBIDAS");
    // the same name is free in another company
    expect((await s.createCategory(admin("a2"), { companyId: "c2", name: "Bebidas" })).companyId).toBe("c2");
  });

  it("invalid category names are INVALID_NAME", async () => {
    const s = setup();
    expect(await rule(s.createCategory(admin("a1"), { companyId: "c1", name: "   " }))).toBe("INVALID_NAME");
    expect(await rule(s.createCategory(admin("a1"), { companyId: "c1", name: "a".repeat(81) }))).toBe("INVALID_NAME");
    expect(s.catalog.categories.size).toBe(0);
  });

  it("CA-12: deleting a category with live products is rejected; once empty it is soft deleted", async () => {
    const s = await seeded();
    const before = s.catalog.snapshot();
    expect(await rule(s.deleteCategory(admin("a1"), { id: s.category.id }))).toBe("CATEGORY_HAS_PRODUCTS");
    expect(s.catalog.snapshot()).toBe(before);
    await s.deleteProduct(admin("a1"), { id: s.product.id });
    await s.deleteCategory(admin("a1"), { id: s.category.id });
    expect(s.catalog.categories.has(s.category.id)).toBe(true);
    expect(s.catalog.deletedCategories.has(s.category.id)).toBe(true);
    expect(await s.listCategories(admin("a1"), { companyId: "c1" })).toEqual([]);
  });

  it("a deleted category name can be reused", async () => {
    const s = await seeded();
    await s.deleteProduct(admin("a1"), { id: s.product.id });
    await s.deleteCategory(admin("a1"), { id: s.category.id });
    const again = await s.createCategory(admin("a1"), { companyId: "c1", name: "bebidas" });
    expect(again.name).toBe("bebidas");
  });

  it("an expired operator session surfaces SessionExpired before anything else", async () => {
    const s = await seeded();
    s.clock.set(new Date(T0.getTime() + 86_400_000 + 1));
    await expect(s.listCategories(operator("u-all"))).rejects.toBeInstanceOf(SessionExpired);
  });
});
