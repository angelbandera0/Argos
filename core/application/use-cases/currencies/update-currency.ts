import type { CurrencyChanges } from "@/core/application/ports/currency-repository";
import type { Actor } from "@/core/domain/actor";
import { validateCurrencyCode, validateCurrencySymbol, validateDecimals } from "@/core/domain/currency";
import { validateName } from "@/core/domain/name";
import { loadScoped, type CurrencyDeps } from "./shared";

export interface UpdateCurrencyInput {
  id: string;
  code?: string;
  name?: string;
  symbol?: string;
  decimals?: number;
  isDefault?: boolean;
}

export function makeUpdateCurrency(deps: CurrencyDeps) {
  return async (actor: Actor, input: UpdateCurrencyInput): Promise<void> => {
    const currency = await loadScoped(deps, actor, { write: true, load: () => deps.currencies.get(input.id) });
    const changes: CurrencyChanges = {};
    if (input.code !== undefined) changes.code = validateCurrencyCode(input.code);
    if (input.name !== undefined) changes.name = validateName(input.name);
    if (input.symbol !== undefined) changes.symbol = validateCurrencySymbol(input.symbol);
    if (input.decimals !== undefined) changes.decimals = validateDecimals(input.decimals);
    if (input.isDefault !== undefined) changes.isDefault = input.isDefault;
    await deps.currencies.update(currency.id, changes);
  };
}
