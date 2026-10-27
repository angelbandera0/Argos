import type { Category } from "@/core/application/ports/catalog-repository";
import type { Actor } from "@/core/domain/actor";
import { resolveCatalogScope, type CatalogDeps } from "./shared";

export function makeListCategories(deps: CatalogDeps) {
  return async (actor: Actor, input: { companyId?: string } = {}): Promise<Category[]> => {
    const { companyId } = await resolveCatalogScope(deps, actor, {
      companyId: input.companyId,
      op: "view",
      resource: "category",
    });
    return deps.catalog.listCategories(companyId);
  };
}
