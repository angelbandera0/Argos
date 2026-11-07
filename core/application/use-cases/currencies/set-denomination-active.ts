import type { Actor } from "@/core/domain/actor";
import { loadScoped, type CurrencyDeps } from "./shared";

export function makeSetDenominationActive(deps: CurrencyDeps) {
  return async (actor: Actor, input: { id: string; active: boolean }): Promise<void> => {
    const denomination = await loadScoped(deps, actor, { write: true, load: () => deps.currencies.getDenomination(input.id) });
    await deps.currencies.updateDenomination(denomination.id, { active: input.active });
  };
}
