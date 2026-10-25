import type { Actor } from "@/core/domain/actor";
import { loadScoped, type CatalogDeps } from "./shared";

export function makeDeleteProduct(deps: CatalogDeps) {
  return async (actor: Actor, input: { id: string }): Promise<void> => {
    const product = await loadScoped(deps, actor, {
      op: "delete",
      resource: "product",
      load: () => deps.catalog.getProduct(input.id),
    });
    await deps.catalog.softDeleteProduct(product.id);
  };
}
