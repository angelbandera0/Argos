import type { Actor } from "@/core/domain/actor";
import { loadScoped, type CurrencyDeps } from "./shared";

export function makeDeleteDenomination(deps: CurrencyDeps) {
  return async (actor: Actor, input: { id: string }): Promise<void> => {
    const denomination = await loadScoped(deps, actor, { op: "delete", load: () => deps.currencies.getDenomination(input.id) });
    await deps.currencies.softDeleteDenomination(denomination.id);
  };
}
