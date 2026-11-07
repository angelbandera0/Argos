import type { DenominationChanges } from "@/core/application/ports/currency-repository";
import type { Actor } from "@/core/domain/actor";
import { validateDenominationValue, validateKind } from "@/core/domain/currency";
import { loadScoped, type CurrencyDeps } from "./shared";

export function makeUpdateDenomination(deps: CurrencyDeps) {
  return async (actor: Actor, input: { id: string; value?: number; kind?: string }): Promise<void> => {
    const denomination = await loadScoped(deps, actor, { write: true, load: () => deps.currencies.getDenomination(input.id) });
    const changes: DenominationChanges = {};
    if (input.value !== undefined) changes.value = validateDenominationValue(input.value);
    if (input.kind !== undefined) changes.kind = validateKind(input.kind);
    await deps.currencies.updateDenomination(denomination.id, changes);
  };
}
