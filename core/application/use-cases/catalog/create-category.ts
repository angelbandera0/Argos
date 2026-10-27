import type { Category } from "@/core/application/ports/catalog-repository";
import type { Actor } from "@/core/domain/actor";
import { RuleViolation } from "@/core/domain/errors";
import { validateName } from "@/core/domain/name";
import { resolveCatalogScope, type CatalogDeps } from "./shared";

export function makeCreateCategory(deps: CatalogDeps) {
  return async (actor: Actor, input: { companyId?: string; name: string }): Promise<Category> => {
    const { companyId } = await resolveCatalogScope(deps, actor, {
      companyId: input.companyId,
      op: "create",
      resource: "category",
    });
    const name = validateName(input.name);
    if (await deps.catalog.categoryNameExists(companyId, name)) throw new RuleViolation("NAME_TAKEN");
    return deps.catalog.createCategory({ companyId, name });
  };
}
