import type { DenominationKind } from "@/core/domain/currency";

export interface Currency {
  id: string;
  companyId: string;
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  isDefault: boolean;
  active: boolean;
}

export interface Denomination {
  id: string;
  companyId: string;
  currencyId: string;
  value: number;
  kind: DenominationKind;
  active: boolean;
}

export type CurrencyChanges = Partial<Omit<Currency, "id" | "companyId">>;
export type DenominationChanges = Partial<Pick<Denomination, "value" | "kind" | "active">>;

/**
 * Soft-deleted rows are invisible to every read. Duplicate codes/values surface as
 * CODE_TAKEN / VALUE_TAKEN and a used currency as CURRENCY_IN_USE (both from the database).
 */
export interface CurrencyRepository {
  create(i: Omit<Currency, "id">): Promise<Currency>;
  update(id: string, changes: CurrencyChanges): Promise<void>;
  get(id: string): Promise<Currency | null>;
  softDelete(id: string): Promise<void>;
  list(companyId: string, filter?: { active?: boolean }): Promise<Currency[]>;
  createDenomination(i: Omit<Denomination, "id">): Promise<Denomination>;
  updateDenomination(id: string, changes: DenominationChanges): Promise<void>;
  getDenomination(id: string): Promise<Denomination | null>;
  softDeleteDenomination(id: string): Promise<void>;
  /** Ordered by value ascending. */
  listDenominations(currencyId: string): Promise<Denomination[]>;
}
