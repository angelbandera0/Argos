import type { Currency } from "@/core/application/ports/currency-repository";
import type { Actor } from "@/core/domain/actor";
import { validateCurrencyCode, validateCurrencySymbol, validateDecimals } from "@/core/domain/currency";
import { validateName } from "@/core/domain/name";
import { resolveCurrencyScope, type CurrencyDeps } from "./shared";

export interface CreateCurrencyInput {
  companyId?: string;
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  isDefault?: boolean;
  active?: boolean;
}

export function makeCreateCurrency(deps: CurrencyDeps) {
  return async (actor: Actor, input: CreateCurrencyInput): Promise<Currency> => {
    const { companyId } = await resolveCurrencyScope(deps, actor, { companyId: input.companyId, op: "create" });
    return deps.currencies.create({
      companyId,
      code: validateCurrencyCode(input.code),
      name: validateName(input.name),
      symbol: validateCurrencySymbol(input.symbol),
      decimals: validateDecimals(input.decimals),
      isDefault: input.isDefault ?? false,
      active: input.active ?? true,
    });
  };
}
