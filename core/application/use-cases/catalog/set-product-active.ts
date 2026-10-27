import type { Actor } from "@/core/domain/actor";
import { loadScoped, type CatalogDeps } from "./shared";

export function makeSetProductActive(deps: CatalogDeps) {
  return async (actor: Actor, input: { id: string; active: boolean }): Promise<void> => {
    const product = await loadScoped(deps, actor, {
      op: "edit",
      resource: "product",
      load: () => deps.catalog.getProduct(input.id),
    });
    await deps.catalog.setActive(product.id, input.active);
  };
}
