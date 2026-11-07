"use server";

import { revalidatePath } from "next/cache";
import { parseDenominationsJson } from "@/components/currencies/currency-form-logic";
import { currencyErrorMessage } from "@/components/currencies/currency-list-logic";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { activeCompanyId, requireCurrencyUser } from "./guard";

export interface CurrencyActionState {
  error?: string;
  codeError?: string;
  /** Set on a successful save so the client can toast and navigate. */
  savedId?: string;
  /** The currency was saved but some denominations were not. */
  warning?: string;
}

const text = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string) : "");

function fail(e: unknown): CurrencyActionState {
  if (e instanceof RuleViolation && e.code === "CODE_TAKEN") return { codeError: currencyErrorMessage(e.code) };
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

function parseCurrency(f: FormData) {
  return {
    code: text(f, "code"),
    name: text(f, "name"),
    symbol: text(f, "symbol"),
    decimals: Number(text(f, "decimals")),
    isDefault: text(f, "isDefault") === "true",
    active: text(f, "active") !== "false",
  };
}

export async function createCurrencyAction(_: CurrencyActionState, formData: FormData): Promise<CurrencyActionState> {
  const ctx = await requireCurrencyUser();
  const companyId = await activeCompanyId(ctx);
  if (!companyId) return { error: "Aún no administras ninguna compañía." };
  try {
    const c = await ctx.currencies.createCurrency(ctx.actor, { companyId, ...parseCurrency(formData) });
    const failed: string[] = [];
    for (const d of parseDenominationsJson(text(formData, "denominations"))) {
      try {
        await ctx.currencies.addDenomination(ctx.actor, { currencyId: c.id, ...d });
      } catch (e) {
        failed.push(`${d.value}: ${fail(e).error ?? currencyErrorMessage(undefined)}`);
      }
    }
    revalidatePath("/divisas", "layout");
    return {
      savedId: c.id,
      warning: failed.length ? `La divisa se creó, pero no se pudieron añadir estas denominaciones: ${failed.join("; ")}` : undefined,
    };
  } catch (e) {
    return fail(e);
  }
}

export async function updateCurrencyAction(
  id: string,
  _: CurrencyActionState,
  formData: FormData,
): Promise<CurrencyActionState> {
  const { actor, currencies } = await requireCurrencyUser();
  const { active, ...data } = parseCurrency(formData);
  try {
    await currencies.updateCurrency(actor, { id, ...data });
    await currencies.setCurrencyActive(actor, { id, active });
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/divisas", "layout");
  return { savedId: id };
}

async function denominationAction(run: (c: Awaited<ReturnType<typeof requireCurrencyUser>>) => Promise<unknown>) {
  const ctx = await requireCurrencyUser();
  try {
    await run(ctx);
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/divisas", "layout");
  return {};
}

export async function addDenominationAction(currencyId: string, value: number, kind: string): Promise<CurrencyActionState> {
  return denominationAction((c) => c.currencies.addDenomination(c.actor, { currencyId, value, kind }));
}

export async function updateDenominationAction(id: string, value: number, kind: string): Promise<CurrencyActionState> {
  return denominationAction((c) => c.currencies.updateDenomination(c.actor, { id, value, kind }));
}

export async function setDenominationActiveAction(id: string, active: boolean): Promise<CurrencyActionState> {
  return denominationAction((c) => c.currencies.setDenominationActive(c.actor, { id, active }));
}

export async function deleteDenominationAction(id: string): Promise<CurrencyActionState> {
  return denominationAction((c) => c.currencies.deleteDenomination(c.actor, { id }));
}
