import type { CatalogRepository, Category, Product } from "@/core/application/ports/catalog-repository";
import { nameKey } from "@/core/domain/name";

export class InMemoryCatalog implements CatalogRepository {
  readonly categories = new Map<string, Category>();
  readonly products = new Map<string, Product>();
  readonly deletedCategories = new Set<string>();
  readonly deletedProducts = new Set<string>();
  private seq = 0;

  private liveCategories(): Category[] {
    return [...this.categories.values()].filter((c) => !this.deletedCategories.has(c.id));
  }

  private liveProducts(): Product[] {
    return [...this.products.values()].filter((p) => !this.deletedProducts.has(p.id));
  }

  /** Snapshot for asserting that a failed use case changed nothing. */
  snapshot(): string {
    return JSON.stringify([
      [...this.categories.values()],
      [...this.products.values()],
      [...this.deletedCategories],
      [...this.deletedProducts],
    ]);
  }

  async createCategory(i: { companyId: string; name: string }): Promise<Category> {
    const category = { id: `cat${++this.seq}`, ...i };
    this.categories.set(category.id, category);
    return { ...category };
  }

  async renameCategory(id: string, name: string): Promise<void> {
    const c = this.categories.get(id);
    if (c) this.categories.set(id, { ...c, name });
  }

  async getCategory(id: string): Promise<Category | null> {
    const c = this.categories.get(id);
    return c && !this.deletedCategories.has(id) ? { ...c } : null;
  }

  async softDeleteCategory(id: string): Promise<void> {
    this.deletedCategories.add(id);
  }

  async countLiveProducts(categoryId: string): Promise<number> {
    return this.liveProducts().filter((p) => p.categoryId === categoryId).length;
  }

  async createProduct(i: Omit<Product, "id">): Promise<Product> {
    const product = { id: `prd${++this.seq}`, ...i };
    this.products.set(product.id, product);
    return { ...product };
  }

  async updateProduct(
    id: string,
    changes: { name?: string; categoryId?: string; description?: string | null },
  ): Promise<void> {
    const p = this.products.get(id);
    if (p) this.products.set(id, { ...p, ...changes });
  }

  async getProduct(id: string): Promise<Product | null> {
    const p = this.products.get(id);
    return p && !this.deletedProducts.has(id) ? { ...p } : null;
  }

  async setActive(id: string, active: boolean): Promise<void> {
    const p = this.products.get(id);
    if (p) this.products.set(id, { ...p, active });
  }

  async softDeleteProduct(id: string): Promise<void> {
    this.deletedProducts.add(id);
  }

  async listProducts(companyId: string, filter?: { onlyActive?: boolean }): Promise<Product[]> {
    return this.liveProducts()
      .filter((p) => p.companyId === companyId && (!filter?.onlyActive || p.active))
      .map((p) => ({ ...p }));
  }

  async listCategories(companyId: string): Promise<Category[]> {
    return this.liveCategories()
      .filter((c) => c.companyId === companyId)
      .map((c) => ({ ...c }));
  }

  async categoryNameExists(companyId: string, name: string, excludeId?: string): Promise<boolean> {
    return this.liveCategories().some(
      (c) => c.companyId === companyId && c.id !== excludeId && nameKey(c.name) === nameKey(name),
    );
  }

  async productNameExists(companyId: string, name: string, excludeId?: string): Promise<boolean> {
    return this.liveProducts().some(
      (p) => p.companyId === companyId && p.id !== excludeId && nameKey(p.name) === nameKey(name),
    );
  }
}
