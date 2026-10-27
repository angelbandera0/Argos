import type { Actor } from "@/core/domain/actor";
import { RuleViolation } from "@/core/domain/errors";
import { validateName } from "@/core/domain/name";
import { loadScoped, type CatalogDeps } from "./shared";

export function makeRenameCategory(deps: CatalogDeps) {
  return async (actor: Actor, input: { id: string; name: string }): Promise<void> => {
    const category = await loadScoped(deps, actor, {
      op: "edit",
      resource: "category",
      load: () => deps.catalog.getCategory(input.id),
    });
    const name = validateName(input.name);
    if (await deps.catalog.categoryNameExists(category.companyId, name, category.id)) {
      throw new RuleViolation("NAME_TAKEN");
    }
    await deps.catalog.renameCategory(category.id, name);
  };
}
