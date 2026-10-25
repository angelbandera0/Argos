import { describe, expect, it } from "vitest";
import { Forbidden, NotFound, RuleViolation, SessionExpired } from "@/core/domain/errors";
import { admin, operator, seeded, T0 } from "./catalog-setup";

async function rule(p: Promise<unknown>): Promise<string> {
  try {
    await p;
  } catch (e) {
    expect(e).toBeInstanceOf(RuleViolation);
    return (e as RuleViolation).code;
  }
  throw new Error("did not throw");
}

describe("products: create", () => {
  it("CA-03: an operator with create registers a product with name, one category, description, state", async () => {
    const s = await seeded();
    const p = await s.createProduct(operator("u-create"), {
      name: " Jugo  de naranja ",
      categoryId: s.category.id,
      description: "  1 litro ",
      active: false,
    });
    expect(p).toEqual({
      id: "prd3",
      companyId: "c1",
      categoryId: s.category.id,
      name: "Jugo de naranja",
      description: "1 litro",
      active: false,
    });
  });

  it("defaults: active true and blank description null; an operator-supplied companyId is ignored", async () => {
    const s = await seeded();
    const p = await s.createProduct(operator("u-create"), {
      companyId: "c2",
      name: "Leche",
      categoryId: s.category.id,
      description: "   ",
    });
    expect(p).toMatchObject({ companyId: "c1", description: null, active: true });
  });

  it("CA-03: without create it is Forbidden and nothing changes", async () => {
    const s = await seeded();
    const before = s.catalog.snapshot();
    for (const u of ["u-view", "u-edit", "u-delete", "u-none"]) {
      await expect(
        s.createProduct(operator(u), { name: "Nuevo", categoryId: s.category.id }),
      ).rejects.toBeInstanceOf(Forbidden);
    }
    expect(s.catalog.snapshot()).toBe(before);
  });

  it("an admin creates only in companies they administer", async () => {
    const s = await seeded();
    await expect(
      s.createProduct(admin("a2"), { companyId: "c1", name: "Nuevo", categoryId: s.category.id }),
    ).rejects.toBeInstanceOf(Forbidden);
    await expect(s.createProduct(admin("a1"), { name: "Nuevo", categoryId: s.category.id })).rejects.toBeInstanceOf(
      Forbidden,
    );
  });

  it("CA-05: a category of another company or a missing one is NotFound", async () => {
    const s = await seeded();
    const foreign = await s.createCategory(admin("a2"), { companyId: "c2", name: "Ajena" });
    const before = s.catalog.snapshot();
    await expect(
      s.createProduct(operator("u-create"), { name: "X", categoryId: foreign.id }),
    ).rejects.toBeInstanceOf(NotFound);
    await expect(
      s.createProduct(admin("a1"), { companyId: "c1", name: "X", categoryId: foreign.id }),
    ).rejects.toBeInstanceOf(NotFound);
    await expect(
      s.createProduct(admin("a1"), { companyId: "c1", name: "X", categoryId: "nope" }),
    ).rejects.toBeInstanceOf(NotFound);
    expect(s.catalog.snapshot()).toBe(before);
  });

  it("CA-04: categoryId is a single identifier, not an array", async () => {
    const s = await seeded();
    // compile-time only: never invoked
    const assignMany = () =>
      s.createProduct(admin("a1"), {
        companyId: "c1",
        name: "Multi",
        // @ts-expect-error a product has exactly one category
        categoryId: [s.category.id, "cat9"],
      });
    void assignMany;
    expect(typeof s.product.categoryId).toBe("string");
  });

  it("CA-11 / REVIEW FOCUS 4: Pan, ' pan ' and PAN collide with an existing 'Pan'", async () => {
    const s = await seeded();
    const before = s.catalog.snapshot();
    for (const name of ["Pan", " pan ", "PAN", "pAn"]) {
      expect(await rule(s.createProduct(operator("u-create"), { name, categoryId: s.category.id }))).toBe(
        "NAME_TAKEN",
      );
    }
    expect(s.catalog.snapshot()).toBe(before);
  });

  it("invalid name or description is INVALID_NAME", async () => {
    const s = await seeded();
    expect(await rule(s.createProduct(admin("a1"), { companyId: "c1", name: " ", categoryId: s.category.id }))).toBe(
      "INVALID_NAME",
    );
    expect(
      await rule(
        s.createProduct(admin("a1"), {
          companyId: "c1",
          name: "Largo",
          categoryId: s.category.id,
          description: "d".repeat(501),
        }),
      ),
    ).toBe("INVALID_NAME");
    expect(s.catalog.products.size).toBe(1);
  });

  it("an expired session is SessionExpired", async () => {
    const s = await seeded();
    s.clock.set(new Date(T0.getTime() + 86_400_000 + 1));
    await expect(
      s.createProduct(operator("u-create"), { name: "Nuevo", categoryId: s.category.id }),
    ).rejects.toBeInstanceOf(SessionExpired);
  });
});

describe("products: update, activate, delete", () => {
  it("CA-06: edit requires edit; create-only operators cannot update", async () => {
    const s = await seeded();
    const before = s.catalog.snapshot();
    await expect(s.updateProduct(operator("u-create"), { id: s.product.id, name: "Otro" })).rejects.toBeInstanceOf(
      Forbidden,
    );
    await expect(s.setActive(operator("u-create"), { id: s.product.id, active: false })).rejects.toBeInstanceOf(
      Forbidden,
    );
    expect(s.catalog.snapshot()).toBe(before);
    await s.updateProduct(operator("u-edit"), { id: s.product.id, name: " Pan  integral ", description: "con semillas" });
    expect(s.catalog.products.get(s.product.id)).toMatchObject({
      name: "Pan integral",
      description: "con semillas",
      categoryId: s.category.id,
    });
  });

  it("update can move the product to another category of the same company, never another company's", async () => {
    const s = await seeded();
    const dairy = await s.createCategory(admin("a1"), { companyId: "c1", name: "Lácteos" });
    const foreign = await s.createCategory(admin("a2"), { companyId: "c2", name: "Ajena" });
    await s.updateProduct(operator("u-edit"), { id: s.product.id, categoryId: dairy.id });
    expect(s.catalog.products.get(s.product.id)?.categoryId).toBe(dairy.id);
    const before = s.catalog.snapshot();
    await expect(s.updateProduct(operator("u-edit"), { id: s.product.id, categoryId: foreign.id })).rejects.toBeInstanceOf(
      NotFound,
    );
    expect(s.catalog.snapshot()).toBe(before);
  });

  it("update excludes the product itself from the name check but not others", async () => {
    const s = await seeded();
    const other = await s.createProduct(admin("a1"), { companyId: "c1", name: "Queso", categoryId: s.category.id });
    await s.updateProduct(operator("u-edit"), { id: s.product.id, name: "PAN" });
    expect(s.catalog.products.get(s.product.id)?.name).toBe("PAN");
    const before = s.catalog.snapshot();
    expect(await rule(s.updateProduct(operator("u-edit"), { id: other.id, name: " pan " }))).toBe("NAME_TAKEN");
    expect(s.catalog.snapshot()).toBe(before);
  });

  it("an operator cannot touch another company's product (NotFound); an admin without access is Forbidden", async () => {
    const s = await seeded();
    const before = s.catalog.snapshot();
    await expect(s.updateProduct(operator("u-other"), { id: s.product.id, name: "X" })).rejects.toBeInstanceOf(NotFound);
    await expect(s.deleteProduct(operator("u-other"), { id: s.product.id })).rejects.toBeInstanceOf(NotFound);
    await expect(s.updateProduct(admin("a2"), { id: s.product.id, name: "X" })).rejects.toBeInstanceOf(Forbidden);
    await expect(s.deleteProduct(admin("a2"), { id: s.product.id })).rejects.toBeInstanceOf(Forbidden);
    await expect(s.updateProduct(admin("a1"), { id: "nope", name: "X" })).rejects.toBeInstanceOf(NotFound);
    expect(s.catalog.snapshot()).toBe(before);
  });

  it("setProductActive toggles the state", async () => {
    const s = await seeded();
    await s.setActive(operator("u-edit"), { id: s.product.id, active: false });
    expect(s.catalog.products.get(s.product.id)?.active).toBe(false);
    await s.setActive(admin("a1"), { id: s.product.id, active: true });
    expect(s.catalog.products.get(s.product.id)?.active).toBe(true);
  });

  it("CA-07: delete requires delete and is a soft delete hidden from the list", async () => {
    const s = await seeded();
    await expect(s.deleteProduct(operator("u-edit"), { id: s.product.id })).rejects.toBeInstanceOf(Forbidden);
    expect(s.catalog.deletedProducts.size).toBe(0);
    await s.deleteProduct(operator("u-delete"), { id: s.product.id });
    expect(s.catalog.products.has(s.product.id)).toBe(true);
    expect(s.catalog.deletedProducts.has(s.product.id)).toBe(true);
    expect(await s.listProducts(operator("u-view"))).toEqual([]);
    await expect(s.deleteProduct(operator("u-delete"), { id: s.product.id })).rejects.toBeInstanceOf(NotFound);
  });

  it("REVIEW FOCUS 5: after deleting a product its name can be reused", async () => {
    const s = await seeded();
    await s.deleteProduct(admin("a1"), { id: s.product.id });
    const again = await s.createProduct(operator("u-create"), { name: " PAN ", categoryId: s.category.id });
    expect(again.name).toBe("PAN");
  });
});

describe("products: list", () => {
  it("CA-08: without view the listing is Forbidden", async () => {
    const s = await seeded();
    await expect(s.listProducts(operator("u-none"))).rejects.toBeInstanceOf(Forbidden);
  });

  it("CA-09: another company sees nothing of this one", async () => {
    const s = await seeded();
    expect(await s.listProducts(operator("u-other"))).toEqual([]);
    expect(await s.listProducts(operator("u-other"), { companyId: "c1" })).toEqual([]);
    await expect(s.listProducts(admin("a2"), { companyId: "c1" })).rejects.toBeInstanceOf(Forbidden);
  });

  it("CA-10: onlyActive excludes inactive products, the normal list keeps them", async () => {
    const s = await seeded();
    await s.createProduct(admin("a1"), { companyId: "c1", name: "Viejo", categoryId: s.category.id, active: false });
    const names = (list: Array<{ name: string }>) => list.map((p) => p.name);
    expect(names(await s.listProducts(operator("u-view")))).toEqual(["Pan", "Viejo"]);
    expect(names(await s.listProducts(operator("u-view"), { onlyActive: true }))).toEqual(["Pan"]);
    expect(names(await s.listProducts(admin("a1"), { companyId: "c1", onlyActive: true }))).toEqual(["Pan"]);
  });

  it("an expired session is SessionExpired", async () => {
    const s = await seeded();
    s.clock.set(new Date(T0.getTime() + 86_400_000 + 1));
    await expect(s.listProducts(operator("u-view"))).rejects.toBeInstanceOf(SessionExpired);
  });
});
