import type { Actor } from "@/core/domain/actor";
import { NotFound, RuleViolation } from "@/core/domain/errors";
import { validateDescription, validateName } from "@/core/domain/name";
import { loadScoped, type CatalogDeps } from "./shared";

export interface UpdateProductInput {
  id: string;
  name?: string;
  categoryId?: string;
  description?: string | null;
}

export function makeUpdateProduct(deps: CatalogDeps) {
  return async (actor: Actor, input: UpdateProductInput): Promise<void> => {
    const product = await loadScoped(deps, actor, {
      op: "edit",
      resource: "product",
      load: () => deps.catalog.getProduct(input.id),
    });
    const changes: { name?: string; categoryId?: string; description?: string | null } = {};
    if (input.name !== undefined) {
      changes.name = validateName(input.name);
      if (await deps.catalog.productNameExists(product.companyId, changes.name, product.id)) {
        throw new RuleViolation("NAME_TAKEN");
      }
    }
    if (input.description !== undefined) changes.description = validateDescription(input.description);
    if (input.categoryId !== undefined) {
      const category = await deps.catalog.getCategory(input.categoryId);
      if (!category || category.companyId !== product.companyId) throw new NotFound();
      changes.categoryId = category.id;
    }
    await deps.catalog.updateProduct(product.id, changes);
  };
}
