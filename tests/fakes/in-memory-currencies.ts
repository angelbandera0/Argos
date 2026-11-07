import type {
  Currency,
  CurrencyChanges,
  CurrencyRepository,
  Denomination,
  DenominationChanges,
} from "@/core/application/ports/currency-repository";
import { RuleViolation } from "@/core/domain/errors";

export class InMemoryCurrencies implements CurrencyRepository {
  readonly currencies = new Map<string, Currency>();
  readonly denominations = new Map<string, Denomination>();
  readonly deleted = new Set<string>();
  readonly used = new Set<string>();
  private seq = 0;

  private live<T extends { id: string }>(m: Map<string, T>): T[] {
    return [...m.values()].filter((x) => !this.deleted.has(x.id));
  }

  private checkCode(companyId: string, code: string, exceptId?: string) {
    const key = code.trim().toLowerCase();
    if (this.live(this.currencies).some((c) => c.companyId === companyId && c.id !== exceptId && c.code.trim().toLowerCase() === key)) {
      throw new RuleViolation("CODE_TAKEN");
    }
  }

  private checkValue(currencyId: string, value: number, exceptId?: string) {
    if (this.live(this.denominations).some((d) => d.currencyId === currencyId && d.id !== exceptId && d.value === value)) {
      throw new RuleViolation("VALUE_TAKEN");
    }
  }

  private single(companyId: string, id: string) {
    for (const c of this.live(this.currencies)) {
      if (c.companyId === companyId && c.id !== id && c.isDefault) this.currencies.set(c.id, { ...c, isDefault: false });
    }
  }

  async create(i: Omit<Currency, "id">): Promise<Currency> {
    this.checkCode(i.companyId, i.code);
    const c = { id: `cur${++this.seq}`, ...i };
    if (c.isDefault) this.single(c.companyId, c.id);
    this.currencies.set(c.id, c);
    return { ...c };
  }

  async update(id: string, changes: CurrencyChanges): Promise<void> {
    const c = this.currencies.get(id)!;
    if (changes.code !== undefined) this.checkCode(c.companyId, changes.code, id);
    if (changes.isDefault) this.single(c.companyId, id);
    this.currencies.set(id, { ...c, ...changes });
  }

  async get(id: string): Promise<Currency | null> {
    const c = this.currencies.get(id);
    return c && !this.deleted.has(id) ? { ...c } : null;
  }

  async softDelete(id: string): Promise<void> {
    if (this.used.has(id)) throw new RuleViolation("CURRENCY_IN_USE");
    this.deleted.add(id);
  }

  async list(companyId: string, filter?: { active?: boolean }): Promise<Currency[]> {
    return this.live(this.currencies)
      .filter((c) => c.companyId === companyId && (filter?.active === undefined || c.active === filter.active))
      .map((c) => ({ ...c }));
  }

  async createDenomination(i: Omit<Denomination, "id">): Promise<Denomination> {
    this.checkValue(i.currencyId, i.value);
    const d = { id: `den${++this.seq}`, ...i };
    this.denominations.set(d.id, d);
    return { ...d };
  }

  async updateDenomination(id: string, changes: DenominationChanges): Promise<void> {
    const d = this.denominations.get(id)!;
    if (changes.value !== undefined) this.checkValue(d.currencyId, changes.value, id);
    this.denominations.set(id, { ...d, ...changes });
  }

  async getDenomination(id: string): Promise<Denomination | null> {
    const d = this.denominations.get(id);
    return d && !this.deleted.has(id) ? { ...d } : null;
  }

  async softDeleteDenomination(id: string): Promise<void> {
    this.deleted.add(id);
  }

  async listDenominations(currencyId: string): Promise<Denomination[]> {
    return this.live(this.denominations)
      .filter((d) => d.currencyId === currencyId)
      .sort((a, b) => a.value - b.value)
      .map((d) => ({ ...d }));
  }
}
