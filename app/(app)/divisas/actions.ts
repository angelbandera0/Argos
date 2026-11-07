"use server";

import { revalidatePath } from "next/cache";
import { currencyErrorMessage } from "@/components/currencies/currency-list-logic";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { requireCurrencyUser } from "./guard";

export interface CurrencyActionState {
  error?: string;
}

function fail(e: unknown): CurrencyActionState {
  if (e instanceof RuleViolation) return { error: currencyErrorMessage(e.code) };
  if (e instanceof Forbidden) return { error: "No tienes permiso para hacer esto." };
  if (e instanceof NotFound) return { error: "No encontramos la divisa. Recarga la página." };
  return { error: currencyErrorMessage(undefined) };
}

export async function setCurrencyActiveAction(id: string, active: boolean): Promise<CurrencyActionState> {
  const { actor, currencies } = await requireCurrencyUser();
  try {
    await currencies.setCurrencyActive(actor, { id, active });
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/divisas", "layout");
  return {};
}

export async function deleteCurrencyAction(id: string): Promise<CurrencyActionState> {
  const { actor, currencies } = await requireCurrencyUser();
  try {
    await currencies.deleteCurrency(actor, { id });
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/divisas", "layout");
  return {};
}
