import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { makeCreateCategory } from "@/core/application/use-cases/catalog/create-category";
import { makeCreateProduct } from "@/core/application/use-cases/catalog/create-product";
import { makeDeleteCategory } from "@/core/application/use-cases/catalog/delete-category";
import { makeDeleteProduct } from "@/core/application/use-cases/catalog/delete-product";
import { makeListCategories } from "@/core/application/use-cases/catalog/list-categories";
import { makeListProducts } from "@/core/application/use-cases/catalog/list-products";
import { makeRenameCategory } from "@/core/application/use-cases/catalog/rename-category";
import { makeSetProductActive } from "@/core/application/use-cases/catalog/set-product-active";
import { makeUpdateProduct } from "@/core/application/use-cases/catalog/update-product";
import { makeCompanyRepository } from "./company-repository";
import { makeCatalogRepository } from "./catalog-repository";
import { makeSessionRepository } from "./session-repository";
import { makeStoreAccessReader } from "./store-access-reader";

const clock = { now: () => new Date() };

/** Catalog use cases bound to one request's user client (RLS applies). */
export function makeCatalog(supabase: SupabaseClient) {
  const deps = {
    catalog: makeCatalogRepository(supabase),
    companies: makeCompanyRepository(supabase),
    sessions: makeSessionRepository(supabase),
    access: makeStoreAccessReader(supabase),
    clock,
  };
  return {
    createCategory: makeCreateCategory(deps),
    renameCategory: makeRenameCategory(deps),
    deleteCategory: makeDeleteCategory(deps),
    createProduct: makeCreateProduct(deps),
    updateProduct: makeUpdateProduct(deps),
    setProductActive: makeSetProductActive(deps),
    deleteProduct: makeDeleteProduct(deps),
    listProducts: makeListProducts(deps),
    listCategories: makeListCategories(deps),
  };
}
