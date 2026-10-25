import type { Product } from "@/core/application/ports/catalog-repository";
import type { Actor } from "@/core/domain/actor";
import { resolveCatalogScope, type CatalogDeps } from "./shared";

export function makeListProducts(deps: CatalogDeps) {
  return async (actor: Actor, input: { companyId?: string; onlyActive?: boolean } = {}): Promise<Product[]> => {
    const { companyId } = await resolveCatalogScope(deps, actor, {
      companyId: input.companyId,
      op: "view",
      resource: "product",
    });
    return deps.catalog.listProducts(companyId, { onlyActive: input.onlyActive ?? false });
  };
}
