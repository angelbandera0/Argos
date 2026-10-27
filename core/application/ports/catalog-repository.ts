export interface Category {
  id: string;
  companyId: string;
  name: string;
}

export interface Product {
  id: string;
  companyId: string;
  categoryId: string;
  name: string;
  description: string | null;
  active: boolean;
}

/** Soft-deleted rows are invisible to every read below. Names arrive already normalized. */
export interface CatalogRepository {
  createCategory(i: { companyId: string; name: string }): Promise<Category>;
  renameCategory(id: string, name: string): Promise<void>;
  getCategory(id: string): Promise<Category | null>;
  softDeleteCategory(id: string): Promise<void>;
  countLiveProducts(categoryId: string): Promise<number>;
  createProduct(i: {
    companyId: string;
    categoryId: string;
    name: string;
    description: string | null;
    active: boolean;
  }): Promise<Product>;
  updateProduct(
    id: string,
    changes: { name?: string; categoryId?: string; description?: string | null },
  ): Promise<void>;
  getProduct(id: string): Promise<Product | null>;
  setActive(id: string, active: boolean): Promise<void>;
  softDeleteProduct(id: string): Promise<void>;
  listProducts(companyId: string, filter?: { onlyActive?: boolean }): Promise<Product[]>;
  listCategories(companyId: string): Promise<Category[]>;
  /** Compares the name key (case and spacing insensitive) over live rows only. */
  categoryNameExists(companyId: string, name: string, excludeId?: string): Promise<boolean>;
  productNameExists(companyId: string, name: string, excludeId?: string): Promise<boolean>;
}
