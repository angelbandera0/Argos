import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Currency, CurrencyRepository, Denomination } from "@/core/application/ports/currency-repository";
import { Forbidden, NotFound, RuleViolation, type RuleCode } from "@/core/domain/errors";

type PgError = { code?: string; message?: string };
type CurrencyRow = {
  id: string;
  company_id: string;
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  is_default: boolean;
  active: boolean;
};
type DenominationRow = {
  id: string;
  company_id: string;
  currency_id: string;
  value: number | string;
  kind: "bill" | "coin";
  active: boolean;
};

const CURRENCY_COLS = "id, company_id, code, name, symbol, decimals, is_default, active";
const DENOMINATION_COLS = "id, company_id, currency_id, value, kind, active";

const toCurrency = (r: CurrencyRow): Currency => ({
  id: r.id,
  companyId: r.company_id,
  code: r.code,
  name: r.name,
  symbol: r.symbol,
  decimals: r.decimals,
  isDefault: r.is_default,
  active: r.active,
});
const toDenomination = (r: DenominationRow): Denomination => ({
  id: r.id,
  companyId: r.company_id,
  currencyId: r.currency_id,
  value: Number(r.value),
  kind: r.kind,
  active: r.active,
});

function currencyError(op: string, error: PgError, duplicate: RuleCode): never {
  if ((error.message ?? "").includes("CURRENCY_IN_USE")) throw new RuleViolation("CURRENCY_IN_USE");
  if (error.code === "23505") throw new RuleViolation(duplicate);
  if (error.code === "23503") throw new NotFound();
  if (error.code === "42501") throw new Forbidden();
  throw new Error(`${op} failed (${error.code ?? "unknown"})`);
}

export function makeCurrencyRepository(supabase: SupabaseClient): CurrencyRepository {
  async function updateOne(table: "currencies" | "currency_denominations", id: string, patch: Record<string, unknown>) {
    const dup = table === "currencies" ? "CODE_TAKEN" : "VALUE_TAKEN";
    const { data, error } = await supabase.from(table).update(patch).eq("id", id).is("deleted_at", null).select("id");
    if (error) currencyError(`update ${table}`, error, dup);
    if (!data?.length) throw new Forbidden();
  }

  return {
    async create(i) {
      const { data, error } = await supabase
        .from("currencies")
        .insert({
          company_id: i.companyId,
          code: i.code,
          name: i.name,
          symbol: i.symbol,
          decimals: i.decimals,
          is_default: i.isDefault,
          active: i.active,
        })
        .select(CURRENCY_COLS)
        .single();
      if (error) currencyError("create currency", error, "CODE_TAKEN");
      return toCurrency(data as CurrencyRow);
    },

    update(id, changes) {
      const patch: Record<string, unknown> = {};
      if (changes.code !== undefined) patch.code = changes.code;
      if (changes.name !== undefined) patch.name = changes.name;
      if (changes.symbol !== undefined) patch.symbol = changes.symbol;
      if (changes.decimals !== undefined) patch.decimals = changes.decimals;
      if (changes.isDefault !== undefined) patch.is_default = changes.isDefault;
      if (changes.active !== undefined) patch.active = changes.active;
      return Object.keys(patch).length ? updateOne("currencies", id, patch) : Promise.resolve();
    },

    async get(id) {
      const { data, error } = await supabase.from("currencies").select(CURRENCY_COLS).eq("id", id).is("deleted_at", null).maybeSingle();
      if (error) currencyError("get currency", error, "CODE_TAKEN");
      return data ? toCurrency(data as CurrencyRow) : null;
    },

    softDelete: (id) => updateOne("currencies", id, { deleted_at: new Date().toISOString() }),

    async list(companyId, filter) {
      let q = supabase.from("currencies").select(CURRENCY_COLS).eq("company_id", companyId).is("deleted_at", null);
      if (filter?.active !== undefined) q = q.eq("active", filter.active);
      const { data, error } = await q.order("code").order("id");
      if (error) currencyError("list currencies", error, "CODE_TAKEN");
      return (data as CurrencyRow[]).map(toCurrency);
    },

    async createDenomination(i) {
      const { data, error } = await supabase
        .from("currency_denominations")
        .insert({ company_id: i.companyId, currency_id: i.currencyId, value: i.value, kind: i.kind, active: i.active })
        .select(DENOMINATION_COLS)
        .single();
      if (error) currencyError("create denomination", error, "VALUE_TAKEN");
      return toDenomination(data as DenominationRow);
    },

    updateDenomination(id, changes) {
      const patch: Record<string, unknown> = {};
      if (changes.value !== undefined) patch.value = changes.value;
      if (changes.kind !== undefined) patch.kind = changes.kind;
      if (changes.active !== undefined) patch.active = changes.active;
      return Object.keys(patch).length ? updateOne("currency_denominations", id, patch) : Promise.resolve();
    },

    async getDenomination(id) {
      const { data, error } = await supabase
        .from("currency_denominations")
        .select(DENOMINATION_COLS)
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) currencyError("get denomination", error, "VALUE_TAKEN");
      return data ? toDenomination(data as DenominationRow) : null;
    },

    softDeleteDenomination: (id) => updateOne("currency_denominations", id, { deleted_at: new Date().toISOString() }),

    async listDenominations(currencyId) {
      const { data, error } = await supabase
        .from("currency_denominations")
        .select(DENOMINATION_COLS)
        .eq("currency_id", currencyId)
        .is("deleted_at", null)
        .order("value")
        .order("id");
      if (error) currencyError("list denominations", error, "VALUE_TAKEN");
      return (data as DenominationRow[]).map(toDenomination);
    },
  };
}
