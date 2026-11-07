import type { Actor } from "@/core/domain/actor";
import { loadScoped, type CurrencyDeps } from "./shared";

export function makeDeleteCurrency(deps: CurrencyDeps) {
  return async (actor: Actor, input: { id: string }): Promise<void> => {
    const currency = await loadScoped(deps, actor, { op: "delete", load: () => deps.currencies.get(input.id) });
    await deps.currencies.softDelete(currency.id);
  };
}
