import type { Actor } from "@/core/domain/actor";
import { RuleViolation } from "@/core/domain/errors";
import { loadScoped, type CatalogDeps } from "./shared";

export function makeDeleteCategory(deps: CatalogDeps) {
  return async (actor: Actor, input: { id: string }): Promise<void> => {
    const category = await loadScoped(deps, actor, {
      op: "delete",
      resource: "category",
      load: () => deps.catalog.getCategory(input.id),
    });
    if ((await deps.catalog.countLiveProducts(category.id)) > 0) {
      throw new RuleViolation("CATEGORY_HAS_PRODUCTS");
    }
    await deps.catalog.softDeleteCategory(category.id);
  };
}
