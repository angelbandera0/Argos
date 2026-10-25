import type { Product } from "@/core/application/ports/catalog-repository";
import type { Actor } from "@/core/domain/actor";
import { NotFound, RuleViolation } from "@/core/domain/errors";
import { validateDescription, validateName } from "@/core/domain/name";
import { resolveCatalogScope, type CatalogDeps } from "./shared";

export interface CreateProductInput {
  companyId?: string;
  name: string;
  /** A product has exactly one category. */
  categoryId: string;
  description?: string | null;
  active?: boolean;
}

export function makeCreateProduct(deps: CatalogDeps) {
  return async (actor: Actor, input: CreateProductInput): Promise<Product> => {
    const { companyId } = await resolveCatalogScope(deps, actor, {
      companyId: input.companyId,
      op: "create",
      resource: "product",
    });
    const name = validateName(input.name);
    const description = validateDescription(input.description);
    const category = await deps.catalog.getCategory(input.categoryId);
    if (!category || category.companyId !== companyId) throw new NotFound();
    if (await deps.catalog.productNameExists(companyId, name)) throw new RuleViolation("NAME_TAKEN");
    return deps.catalog.createProduct({
      companyId,
      categoryId: category.id,
      name,
      description,
      active: input.active ?? true,
    });
  };
}
