import type { Denomination } from "@/core/application/ports/currency-repository";
import type { Actor } from "@/core/domain/actor";
import { validateDenomination } from "@/core/domain/currency";
import { loadScoped, type CurrencyDeps } from "./shared";

export function makeAddDenomination(deps: CurrencyDeps) {
  return async (
    actor: Actor,
    input: { currencyId: string; value: number; kind: string; active?: boolean },
  ): Promise<Denomination> => {
    const currency = await loadScoped(deps, actor, { op: "create", load: () => deps.currencies.get(input.currencyId) });
    return deps.currencies.createDenomination({
      companyId: currency.companyId,
      currencyId: currency.id,
      ...validateDenomination(input),
      active: input.active ?? true,
    });
  };
}
