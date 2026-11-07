"use server";

import { revalidatePath } from "next/cache";
import { transferErrorMessage, transferSchema, type LotPick, type PreviewLot } from "@/components/stock/transfer-logic";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { requireStockUser } from "./guard";

export interface TransferActionState {
  error?: string;
}

export interface TransferConfig {
  baseUnit: string;
  units: string[];
}

export interface TransferPreview {
  baseQty: number;
  lots: PreviewLot[];
  suggested: LotPick[];
  allocation: LotPick[];
  isDeviation: boolean;
  error?: string;
}

const text = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string) : "");

export async function loadTransferConfigAction(productId: string): Promise<TransferConfig | null> {
  const { actor, stock } = await requireStockUser();
  try {
    const c = await stock.getProductStockConfig(actor, { productId });
    return c.storable ? { baseUnit: c.baseUnit, units: c.movementUnits.filter((u) => u.active).map((u) => u.name) } : null;
  } catch {
    return null;
  }
}

export async function previewTransferAction(input: { productId: string; fromLocationId: string; qty: number; unit: string; picks?: LotPick[] }): Promise<TransferPreview> {
  const { actor, stock } = await requireStockUser();
  try {
    const r = await stock.previewConsumption(actor, { ...input, locationId: input.fromLocationId });
    return {
      baseQty: r.baseQty,
      lots: r.lots.map((l) => ({ id: l.id, receivedAt: l.receivedAt, remaining: l.remaining, unitCost: l.unitCost })),
      suggested: r.suggested,
      allocation: r.allocation,
      isDeviation: r.isDeviation,
      error: r.errors?.[0] ? transferErrorMessage(r.errors[0]) : undefined,
    };
  } catch (e) {
    const error = e instanceof Forbidden ? "No tienes permiso para hacer esto." : transferErrorMessage(e instanceof RuleViolation ? e.code : undefined);
    return { baseQty: 0, lots: [], suggested: [], allocation: [], isDeviation: false, error };
  }
}

export async function transferStockAction(fromLocationId: string, _prev: TransferActionState, f: FormData): Promise<TransferActionState> {
  const { actor, stock } = await requireStockUser();
  const p = transferSchema.safeParse({
    productId: text(f, "productId"),
    toLocationId: text(f, "toLocationId"),
    qty: text(f, "qty"),
    unit: text(f, "unit"),
    picks: text(f, "picks"),
    reason: text(f, "reason"),
  });
  if (!p.success) return { error: transferErrorMessage("INVALID_INPUT") };
  const d = p.data;
  try {
    await stock.transferStock(actor, {
      productId: d.productId,
      fromLocationId,
      toLocationId: d.toLocationId,
      qty: d.qty,
      unit: d.unit,
      picks: d.picks,
      deviationReason: d.reason || undefined,
    });
  } catch (e) {
    if (e instanceof Forbidden) return { error: "No tienes permiso para hacer esto." };
    if (e instanceof NotFound) return { error: "No encontramos el elemento. Recarga la página." };
    return { error: transferErrorMessage(e instanceof RuleViolation ? e.code : undefined) };
  }
  revalidatePath("/existencias", "layout");
  return {};
}
