import { describe, expect, it } from "vitest";
import { Forbidden, SessionExpired } from "@/core/domain/errors";
import { admin, operator, seeded, superadmin, T0 } from "./catalog-setup";

async function foreign() {
  const s = await seeded();
  const cat = await s.createCategory(admin("a2"), { companyId: "c2", name: "Ajena" });
  const prod = await s.createProduct(admin("a2"), { companyId: "c2", name: "Ajeno", categoryId: cat.id });
  return { ...s, fCat: cat, fProd: prod };
}

describe("permission is checked before any entity lookup", () => {
  it("an unpermitted operator gets Forbidden on missing ids, never NotFound", async () => {
    const s = await foreign();
    const before = s.catalog.snapshot();
    await expect(s.updateProduct(operator("u-create"), { id: "nope" })).rejects.toBeInstanceOf(Forbidden);
    await expect(s.setActive(operator("u-create"), { id: "nope", active: false })).rejects.toBeInstanceOf(Forbidden);
    await expect(s.deleteProduct(operator("u-edit"), { id: "nope" })).rejects.toBeInstanceOf(Forbidden);
    await expect(s.renameCategory(operator("u-all"), { id: "nope", name: "X" })).rejects.toBeInstanceOf(Forbidden);
    await expect(s.deleteCategory(operator("u-all"), { id: "nope" })).rejects.toBeInstanceOf(Forbidden);
    expect(s.catalog.snapshot()).toBe(before);
  });

  it("an unpermitted operator gets Forbidden on another company's ids, never NotFound", async () => {
    const s = await foreign();
    const before = s.catalog.snapshot();
    await expect(s.updateProduct(operator("u-create"), { id: s.fProd.id, name: "X" })).rejects.toBeInstanceOf(Forbidden);
    await expect(s.setActive(operator("u-create"), { id: s.fProd.id, active: false })).rejects.toBeInstanceOf(
      Forbidden,
    );
    await expect(s.deleteProduct(operator("u-edit"), { id: s.fProd.id })).rejects.toBeInstanceOf(Forbidden);
    await expect(s.renameCategory(operator("u-all"), { id: s.fCat.id, name: "X" })).rejects.toBeInstanceOf(Forbidden);
    await expect(s.deleteCategory(operator("u-all"), { id: s.fCat.id })).rejects.toBeInstanceOf(Forbidden);
    expect(s.catalog.snapshot()).toBe(before);
  });
});

describe("session is checked before permission", () => {
  it("an expired operator without the permission gets SessionExpired, not Forbidden, and the session ends", async () => {
    const s = await seeded();
    s.clock.set(new Date(T0.getTime() + 86_400_000 + 1));
    const u = operator("u-none");
    await expect(s.createProduct(u, { name: "N", categoryId: s.category.id })).rejects.toBeInstanceOf(SessionExpired);
    expect(s.sessions.sessions.get("s-u-none")?.endedAt).not.toBeNull();
  });

  it("covers list and category writes too", async () => {
    const s = await seeded();
    s.clock.set(new Date(T0.getTime() + 86_400_000 + 1));
    await expect(s.listProducts(operator("u-none"))).rejects.toBeInstanceOf(SessionExpired);
    await expect(s.createCategory(operator("u-view"), { name: "N" })).rejects.toBeInstanceOf(SessionExpired);
    await expect(s.updateProduct(operator("u-create"), { id: s.product.id })).rejects.toBeInstanceOf(SessionExpired);
    expect(s.sessions.sessions.get("s-u-view")?.endedAt).not.toBeNull();
    expect(s.sessions.sessions.get("s-u-create")?.endedAt).not.toBeNull();
  });
});

describe("superadmin has no catalog access", () => {
  it("is Forbidden on update, set active, delete and list, existing id or not", async () => {
    const s = await seeded();
    const before = s.catalog.snapshot();
    await expect(s.updateProduct(superadmin, { id: s.product.id, name: "X" })).rejects.toBeInstanceOf(Forbidden);
    await expect(s.updateProduct(superadmin, { id: "nope" })).rejects.toBeInstanceOf(Forbidden);
    await expect(s.setActive(superadmin, { id: s.product.id, active: false })).rejects.toBeInstanceOf(Forbidden);
    await expect(s.deleteProduct(superadmin, { id: s.product.id })).rejects.toBeInstanceOf(Forbidden);
    await expect(s.listProducts(superadmin, { companyId: "c1" })).rejects.toBeInstanceOf(Forbidden);
    await expect(s.listCategories(superadmin, { companyId: "c1" })).rejects.toBeInstanceOf(Forbidden);
    expect(s.catalog.snapshot()).toBe(before);
  });
});
