import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { makeAddDenomination } from "@/core/application/use-cases/currencies/add-denomination";
import { makeCreateCurrency } from "@/core/application/use-cases/currencies/create-currency";
import { makeDeleteCurrency } from "@/core/application/use-cases/currencies/delete-currency";
import { makeDeleteDenomination } from "@/core/application/use-cases/currencies/delete-denomination";
import { makeGetCurrency } from "@/core/application/use-cases/currencies/get-currency";
import { makeListCurrencies } from "@/core/application/use-cases/currencies/list-currencies";
import { makeListDenominations } from "@/core/application/use-cases/currencies/list-denominations";
import { makeSetCurrencyActive } from "@/core/application/use-cases/currencies/set-currency-active";
import { makeSetDenominationActive } from "@/core/application/use-cases/currencies/set-denomination-active";
import { makeUpdateCurrency } from "@/core/application/use-cases/currencies/update-currency";
import { makeUpdateDenomination } from "@/core/application/use-cases/currencies/update-denomination";
import { makeCompanyRepository } from "./company-repository";
import { makeCurrencyRepository } from "./currency-repository";
import { makeSessionRepository } from "./session-repository";
import { makeStoreAccessReader } from "./store-access-reader";

const clock = { now: () => new Date() };

/** Currency use cases bound to one request's user client (RLS applies). */
export function makeCurrencies(supabase: SupabaseClient) {
  const deps = {
    currencies: makeCurrencyRepository(supabase),
    companies: makeCompanyRepository(supabase),
    sessions: makeSessionRepository(supabase),
    access: makeStoreAccessReader(supabase),
    clock,
  };
  return {
    createCurrency: makeCreateCurrency(deps),
    updateCurrency: makeUpdateCurrency(deps),
    setCurrencyActive: makeSetCurrencyActive(deps),
    deleteCurrency: makeDeleteCurrency(deps),
    listCurrencies: makeListCurrencies(deps),
    getCurrency: makeGetCurrency(deps),
    listDenominations: makeListDenominations(deps),
    addDenomination: makeAddDenomination(deps),
    updateDenomination: makeUpdateDenomination(deps),
    setDenominationActive: makeSetDenominationActive(deps),
    deleteDenomination: makeDeleteDenomination(deps),
  };
}
