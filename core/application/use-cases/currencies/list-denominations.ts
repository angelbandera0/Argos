import type { Denomination } from "@/core/application/ports/currency-repository";
import type { Actor } from "@/core/domain/actor";
import { loadScoped, type CurrencyDeps } from "./shared";

export function makeListDenominations(deps: CurrencyDeps) {
  return async (actor: Actor, input: { currencyId: string }): Promise<Denomination[]> => {
    const currency = await loadScoped(deps, actor, { write: false, load: () => deps.currencies.get(input.currencyId) });
    return deps.currencies.listDenominations(currency.id);
  };
}
