import type { Currency, Denomination } from "@/core/application/ports/currency-repository";
import type { Actor } from "@/core/domain/actor";
import { loadScoped, type CurrencyDeps } from "./shared";

export function makeGetCurrency(deps: CurrencyDeps) {
  return async (actor: Actor, input: { id: string }): Promise<Currency & { denominations: Denomination[] }> => {
    const currency = await loadScoped(deps, actor, { op: "view", load: () => deps.currencies.get(input.id) });
    return { ...currency, denominations: await deps.currencies.listDenominations(currency.id) };
  };
}
