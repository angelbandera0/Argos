import type { CurrencyListItem } from "@/core/application/ports/currency-repository";
import type { Actor } from "@/core/domain/actor";
import { nameKey } from "@/core/domain/name";
import { resolveCurrencyScope, type CurrencyDeps } from "./shared";

export interface ListCurrenciesInput {
  companyId?: string;
  active?: boolean;
  search?: string;
}

export function makeListCurrencies(deps: CurrencyDeps) {
  return async (actor: Actor, input: ListCurrenciesInput = {}): Promise<CurrencyListItem[]> => {
    const { companyId } = await resolveCurrencyScope(deps, actor, { companyId: input.companyId, op: "view" });
    const all = await deps.currencies.list(companyId, { active: input.active });
    const term = nameKey(input.search ?? "");
    if (!term) return all;
    return all.filter((c) => nameKey(`${c.code} ${c.name}`).includes(term));
  };
}
