import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CatalogRepository, Category, Product } from "@/core/application/ports/catalog-repository";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { nameKey } from "@/core/domain/name";

type PgError = { code?: string; message?: string };
type CategoryRow = { id: string; company_id: string; name: string };
type ProductRow = CategoryRow & { category_id: string; description: string | null; active: boolean };

const PRODUCT_COLS = "id, company_id, category_id, name, description, active";

const toCategory = (r: CategoryRow): Category => ({ id: r.id, companyId: r.company_id, name: r.name });
const toProduct = (r: ProductRow): Product => ({
  id: r.id,
  companyId: r.company_id,
  categoryId: r.category_id,
  name: r.name,
  description: r.description,
  active: r.active,
});

function catalogError(op: string, error: PgError): never {
  if ((error.message ?? "").includes("CATEGORY_HAS_PRODUCTS")) throw new RuleViolation("CATEGORY_HAS_PRODUCTS");
  if (error.code === "23505") throw new RuleViolation("NAME_TAKEN");
  if (error.code === "23503") throw new NotFound();
  if (error.code === "42501") throw new Forbidden();
  throw new Error(`${op} failed (${error.code ?? "unknown"})`);
}

export function makeCatalogRepository(supabase: SupabaseClient): CatalogRepository {
  async function requireLiveCategory(id: string): Promise<void> {
    const { data, error } = await supabase.from("categories").select("id").eq("id", id).is("deleted_at", null).maybeSingle();
    if (error) catalogError("check category", error);
    if (!data) throw new NotFound();
  }

  async function updateOne(table: "categories" | "products", id: string, patch: Record<string, unknown>) {
    const { data, error } = await supabase.from(table).update(patch).eq("id", id).is("deleted_at", null).select("id");
    if (error) catalogError(`update ${table}`, error);
    if (!data?.length) throw new Forbidden();
  }

  async function nameExists(table: "categories" | "products", companyId: string, name: string, excludeId?: string) {
    const { data, error } = await supabase.from(table).select("id, name").eq("company_id", companyId).is("deleted_at", null);
    if (error) catalogError(`check ${table} name`, error);
    return (data ?? []).some((r) => r.id !== excludeId && nameKey(r.name) === nameKey(name));
  }

  return {
    async createCategory(i) {
      const { data, error } = await supabase
        .from("categories")
        .insert({ company_id: i.companyId, name: i.name })
        .select("id, company_id, name")
        .single();
      if (error) catalogError("create category", error);
      return toCategory(data as CategoryRow);
    },

    renameCategory: (id, name) => updateOne("categories", id, { name }),

    async getCategory(id) {
      const { data, error } = await supabase
        .from("categories")
        .select("id, company_id, name")
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) catalogError("get category", error);
      return data ? toCategory(data as CategoryRow) : null;
    },

    softDeleteCategory: (id) => updateOne("categories", id, { deleted_at: new Date().toISOString() }),

    async countLiveProducts(categoryId) {
      const { count, error } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("category_id", categoryId)
        .is("deleted_at", null);
      if (error) catalogError("count products", error);
      return count ?? 0;
    },

    async createProduct(i) {
      await requireLiveCategory(i.categoryId);
      const { data, error } = await supabase
        .from("products")
        .insert({
          company_id: i.companyId,
          category_id: i.categoryId,
          name: i.name,
          description: i.description,
          active: i.active,
        })
        .select(PRODUCT_COLS)
        .single();
      if (error) catalogError("create product", error);
      return toProduct(data as ProductRow);
    },

    async updateProduct(id, changes) {
      if (changes.categoryId !== undefined) await requireLiveCategory(changes.categoryId);
      const patch: Record<string, unknown> = {};
      if (changes.name !== undefined) patch.name = changes.name;
      if (changes.categoryId !== undefined) patch.category_id = changes.categoryId;
      if (changes.description !== undefined) patch.description = changes.description;
      if (Object.keys(patch).length) await updateOne("products", id, patch);
    },

    async getProduct(id) {
      const { data, error } = await supabase.from("products").select(PRODUCT_COLS).eq("id", id).is("deleted_at", null).maybeSingle();
      if (error) catalogError("get product", error);
      return data ? toProduct(data as ProductRow) : null;
    },

    setActive: (id, active) => updateOne("products", id, { active }),

    async softDeleteProduct(id) {
      // Operators cannot soft-delete with a direct update (the row would leave their view); admins can.
      const { error } = await supabase.rpc("delete_product", { p_id: id });
      if (!error) return;
      if (error.code !== "42501") catalogError("delete product", error);
      await updateOne("products", id, { deleted_at: new Date().toISOString() });
    },

    async listProducts(companyId, filter) {
      let q = supabase.from("products").select(PRODUCT_COLS).eq("company_id", companyId).is("deleted_at", null);
      if (filter?.onlyActive) q = q.eq("active", true);
      const { data, error } = await q.order("name").order("id");
      if (error) catalogError("list products", error);
      return (data as ProductRow[]).map(toProduct);
    },

    async listCategories(companyId) {
      const { data, error } = await supabase
        .from("categories")
        .select("id, company_id, name")
        .eq("company_id", companyId)
        .is("deleted_at", null)
        .order("name")
        .order("id");
      if (error) catalogError("list categories", error);
      return (data as CategoryRow[]).map(toCategory);
    },

    categoryNameExists: (companyId, name, excludeId) => nameExists("categories", companyId, name, excludeId),
    productNameExists: (companyId, name, excludeId) => nameExists("products", companyId, name, excludeId),
  };
}
