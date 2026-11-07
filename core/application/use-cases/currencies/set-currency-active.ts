import type { Actor } from "@/core/domain/actor";
import { loadScoped, type CurrencyDeps } from "./shared";

export function makeSetCurrencyActive(deps: CurrencyDeps) {
  return async (actor: Actor, input: { id: string; active: boolean }): Promise<void> => {
    const currency = await loadScoped(deps, actor, { op: "edit", load: () => deps.currencies.get(input.id) });
    await deps.currencies.update(currency.id, { active: input.active });
  };
}
