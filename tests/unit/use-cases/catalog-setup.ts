import type { StoreAccess } from "@/core/application/ports/store-access-reader";
import type { Actor } from "@/core/domain/actor";
import type { Op } from "@/core/domain/permissions";
import { makeCreateCategory } from "@/core/application/use-cases/catalog/create-category";
import { makeCreateProduct } from "@/core/application/use-cases/catalog/create-product";
import { makeDeleteCategory } from "@/core/application/use-cases/catalog/delete-category";
import { makeDeleteProduct } from "@/core/application/use-cases/catalog/delete-product";
import { makeListCategories } from "@/core/application/use-cases/catalog/list-categories";
import { makeListProducts } from "@/core/application/use-cases/catalog/list-products";
import { makeRenameCategory } from "@/core/application/use-cases/catalog/rename-category";
import { makeSetProductActive } from "@/core/application/use-cases/catalog/set-product-active";
import { makeUpdateProduct } from "@/core/application/use-cases/catalog/update-product";
import { FakeClock } from "../../fakes/fake-clock";
import { FakeStoreAccess } from "../../fakes/fake-store-access";
import { InMemoryCatalog } from "../../fakes/in-memory-catalog";
import { InMemoryOrganization } from "../../fakes/in-memory-organization";
import { InMemorySessions } from "../../fakes/in-memory-sessions";

export const T0 = new Date("2026-01-01T08:00:00.000Z");

export const admin = (userId: string): Actor => ({ userId, kind: "admin", channel: "ui" });
export const superadmin: Actor = { userId: "sa", kind: "superadmin", channel: "ui" };
export const operator = (userId: string): Actor => ({
  userId,
  kind: "operator",
  channel: "app",
  sessionId: `s-${userId}`,
});

const perms = (...ops: Op[]) => ({
  products: {
    view: ops.includes("view"),
    create: ops.includes("create"),
    edit: ops.includes("edit"),
    delete: ops.includes("delete"),
  },
});

const access = (storeId: string, companyId: string, ...ops: Op[]): StoreAccess => ({
  storeId,
  storeName: storeId,
  siteName: "Site",
  companyId,
  roleId: "r1",
  roleName: "Role",
  roleSessionSeconds: null,
  companyCapSeconds: 86400,
  operational: true,
  permissions: perms(...ops),
});

/**
 * Companies c1 (admin a1) and c2 (admin a2). Operators: u-all (all ops, c1), u-view (view, c1),
 * u-create (view+create, c1), u-edit (view+edit, c1), u-delete (view+delete, c1),
 * u-none (no permissions, c1), u-other (all ops, c2).
 */
export function setup() {
  const clock = new FakeClock(T0);
  const sessions = new InMemorySessions(clock);
  const org = new InMemoryOrganization();
  org.admins.set("c1", new Set(["a1"]));
  org.admins.set("c2", new Set(["a2"]));
  const catalog = new InMemoryCatalog();
  const all: Op[] = ["view", "create", "edit", "delete"];
  const users: Array<[string, string, Op[]]> = [
    ["u-all", "c1", all],
    ["u-view", "c1", ["view"]],
    ["u-create", "c1", ["view", "create"]],
    ["u-edit", "c1", ["view", "edit"]],
    ["u-delete", "c1", ["view", "delete"]],
    ["u-none", "c1", []],
    ["u-other", "c2", all],
  ];
  const byUser: Record<string, StoreAccess[]> = {};
  for (const [id, companyId, ops] of users) {
    byUser[id] = [access(`t-${id}`, companyId, ...ops)];
    void sessions.start({ sessionId: `s-${id}`, userId: id, startedAt: T0 });
    void sessions.setActiveStore(`s-${id}`, `t-${id}`);
  }
  const deps = {
    catalog,
    companies: org.companyRepo,
    sessions,
    access: new FakeStoreAccess(byUser),
    clock,
  };
  return {
    deps,
    clock,
    sessions,
    catalog,
    createCategory: makeCreateCategory(deps),
    renameCategory: makeRenameCategory(deps),
    deleteCategory: makeDeleteCategory(deps),
    createProduct: makeCreateProduct(deps),
    updateProduct: makeUpdateProduct(deps),
    setActive: makeSetProductActive(deps),
    deleteProduct: makeDeleteProduct(deps),
    listProducts: makeListProducts(deps),
    listCategories: makeListCategories(deps),
  };
}

/** Seeds category "Bebidas" and product "Pan" in company c1 through the admin use cases. */
export async function seeded() {
  const s = setup();
  const category = await s.createCategory(admin("a1"), { companyId: "c1", name: "Bebidas" });
  const product = await s.createProduct(admin("a1"), {
    companyId: "c1",
    name: "Pan",
    categoryId: category.id,
  });
  return { ...s, category, product };
}
