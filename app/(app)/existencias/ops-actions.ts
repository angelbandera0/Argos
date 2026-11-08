"use server";

import { revalidatePath } from "next/cache";
import { adjustSchema, reasonCode, reasonNameSchema, stockOpErrorMessage, surplusSchema, writeOffSchema } from "@/components/stock/ops-logic";
import { costAdjustSchema } from "@/components/stock/cost-adjust-logic";
import { createServerClient } from "@/infrastructure/supabase/server-client";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { requireStockUser } from "./guard";

export interface OpActionState {
  error?: string;
  nameError?: string;
}

export interface ReasonOption {
  id: string;
  name: string;
  requiresText: boolean;
  active: boolean;
  standard: boolean;
}

const text = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string) : "");
const INVALID: OpActionState = { error: stockOpErrorMessage("INVALID_INPUT") };

function fail(e: unknown): OpActionState {
  if (e instanceof Forbidden) return { error: "No tienes permiso para hacer esto." };
  if (e instanceof NotFound) return { error: "No encontramos el elemento. Recarga la página." };
  const code = e instanceof RuleViolation ? e.code : undefined;
  if (code === "NAME_TAKEN" || code === "CODE_TAKEN") return { nameError: stockOpErrorMessage(code) };
  return { error: stockOpErrorMessage(code) };
}

async function run(fn: (u: Awaited<ReturnType<typeof requireStockUser>>) => Promise<unknown>): Promise<OpActionState> {
  const user = await requireStockUser();
  try {
    await fn(user);
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/existencias", "layout");
  return {};
}

export async function loadReasonsAction(includeInactive = false): Promise<ReasonOption[]> {
  const { actor, stock, companyId } = await requireStockUser();
  try {
    const all = await stock.listWriteOffReasons(actor, { companyId });
    return all.filter((r) => includeInactive || r.active).map((r) => ({ id: r.id, name: r.name, requiresText: r.requiresText, active: r.active, standard: r.standard }));
  } catch {
    return [];
  }
}

export async function writeOffAction(locationId: string, _prev: OpActionState, f: FormData): Promise<OpActionState> {
  const p = writeOffSchema.safeParse({ productId: text(f, "productId"), qty: text(f, "qty"), unit: text(f, "unit"), reasonId: text(f, "reasonId"), requiresText: text(f, "requiresText"), text: text(f, "text"), picks: text(f, "picks"), deviation: text(f, "deviation") });
  if (!p.success) return p.error.issues.some((i) => i.message === "REASON_TEXT_REQUIRED") ? { error: stockOpErrorMessage("REASON_TEXT_REQUIRED") } : INVALID;
  const d = p.data;
  return run(({ actor, stock }) => stock.writeOffStock(actor, { productId: d.productId, locationId, qty: d.qty, unit: d.unit, reasonId: d.reasonId, reasonText: d.text || undefined, picks: d.picks, deviationReason: d.deviation || undefined }));
}

export async function adjustLotAction(_prev: OpActionState, f: FormData): Promise<OpActionState> {
  const p = adjustSchema.safeParse({ lotId: text(f, "lotId"), delta: text(f, "delta"), text: text(f, "text") });
  if (!p.success) return INVALID;
  const d = p.data;
  return run(({ actor, stock }) => stock.adjustLot(actor, { lotId: d.lotId, delta: d.delta, reasonText: d.text }));
}

export async function adjustLotCostAction(_prev: OpActionState, f: FormData): Promise<OpActionState> {
  const p = costAdjustSchema.safeParse({ lotId: text(f, "lotId"), newUnitCost: text(f, "newUnitCost"), text: text(f, "text") });
  if (!p.success) return p.error.issues.some((i) => i.path[0] === "newUnitCost") ? { error: stockOpErrorMessage("INVALID_COST") } : INVALID;
  const d = p.data;
  const r = await run(({ actor, stock }) => stock.adjustLotCost(actor, { lotId: d.lotId, newUnitCost: d.newUnitCost, reason: d.text }));
  if (!r.error) revalidatePath("/pedidos", "layout");
  return r;
}

export interface CostAdjustmentRow {
  id: string;
  oldUnitCost: number | null;
  newUnitCost: number;
  reason: string;
  by: string;
  createdAt: string;
}

export async function loadCostAdjustmentsAction(lotId: string): Promise<CostAdjustmentRow[]> {
  const { actor, stock } = await requireStockUser();
  try {
    const list = await stock.listLotCostAdjustments(actor, { lotId });
    const ids = [...new Set(list.map((a) => a.createdBy).filter((x): x is string => !!x))];
    const names = new Map<string, string>();
    if (ids.length) {
      const { data } = await (await createServerClient()).from("profiles").select("id, display_name").in("id", ids);
      for (const r of data ?? []) names.set(r.id, r.display_name);
    }
    return list.map((a) => ({ id: a.id, oldUnitCost: a.oldUnitCost, newUnitCost: a.newUnitCost, reason: a.reason, by: (a.createdBy && names.get(a.createdBy)) || "Administrador", createdAt: a.createdAt }));
  } catch {
    return [];
  }
}

export async function registerSurplusAction(locationId: string, _prev: OpActionState, f: FormData): Promise<OpActionState> {
  const p = surplusSchema.safeParse({ productId: text(f, "productId"), qty: text(f, "qty"), unit: text(f, "unit") || undefined, content: text(f, "content"), text: text(f, "text"), unitCost: text(f, "unitCost"), currencyId: text(f, "currencyId") });
  if (!p.success) return INVALID;
  const d = p.data;
  return run(({ actor, stock, costs }) =>
    stock.registerSurplus(actor, { productId: d.productId, locationId, qty: d.qty, unit: d.unit, content: d.content, reasonText: d.text, ...(costs && d.unitCost !== undefined && d.currencyId ? { unitCost: d.unitCost, currencyId: d.currencyId } : {}) }),
  );
}

export async function saveReasonAction(id: string | null, _prev: OpActionState, f: FormData): Promise<OpActionState> {
  const p = reasonNameSchema.safeParse({ name: text(f, "name") });
  if (!p.success) return INVALID;
  const { name } = p.data;
  return run(({ actor, stock, companyId }) =>
    id ? stock.renameWriteOffReason(actor, { id, name }) : stock.createWriteOffReason(actor, { companyId: companyId ?? "", code: reasonCode(name), name }),
  );
}

export const setReasonActiveAction = async (id: string, active: boolean) => run(({ actor, stock }) => stock.setWriteOffReasonActive(actor, { id, active }));
export const deleteReasonAction = async (id: string) => run(({ actor, stock }) => stock.deleteWriteOffReason(actor, { id }));
