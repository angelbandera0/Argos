"use server";

import { revalidatePath } from "next/cache";
import { packShortageMessage, moveUnitOptions, type MoveUnitOption, transferErrorMessage, transferLinesSchema, type LotPick, type PreviewLot } from "@/components/stock/transfer-logic";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { requireStockUser } from "./guard";

export interface TransferActionState {
  error?: string;
}

export interface TransferConfig {
  baseUnit: string;
  units: string[];
  options: MoveUnitOption[];
}

export interface TransferPreview {
  baseQty: number;
  lots: PreviewLot[];
  suggested: LotPick[];
  allocation: LotPick[];
  isDeviation: boolean;
  /** Present when asked by presentation: picks and suggestions count packs per lot, and `perLot` the complete packs each lot holds. */
  pack?: { name: string; available: number; perLot: { lotId: string; packs: number }[] };
  suggestedPacks?: LotPick[];
  allocationPacks?: LotPick[];
  error?: string;
}

const text = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string) : "");

export async function loadTransferConfigAction(productId: string): Promise<TransferConfig | null> {
  const { actor, stock } = await requireStockUser();
  try {
    const c = await stock.getProductStockConfig(actor, { productId });
    return c.storable ? { baseUnit: c.baseUnit, units: c.movementUnits.filter((u) => u.active).map((u) => u.name),
          options: moveUnitOptions({ baseUnit: c.baseUnit, presentations: c.presentations.filter((p) => p.active), units: c.movementUnits.filter((u) => u.active) }),
        }
      : null;
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
      lots: r.lots.map((l) => ({ id: l.id, receivedAt: l.receivedAt, remaining: l.remaining, presentation: l.presentation, unitCost: l.unitCost })),
      suggested: r.suggested,
      allocation: r.allocation,
      isDeviation: r.isDeviation,
      pack: r.pack ?? undefined,
      suggestedPacks: r.suggestedPacks,
      allocationPacks: r.allocationPacks,
      error: r.errors?.[0] ? (r.errors[0] === "INSUFFICIENT_PACKS" && r.pack ? packShortageMessage(r.pack.name, r.pack.available) : transferErrorMessage(r.errors[0])) : undefined,
    };
  } catch (e) {
    const error = e instanceof Forbidden ? "No tienes permiso para hacer esto." : transferErrorMessage(e instanceof RuleViolation ? e.code : undefined);
    return { baseQty: 0, lots: [], suggested: [], allocation: [], isDeviation: false, error };
  }
}

/** Validates every line first (nothing moves if one is wrong), then transfers line by line; a failure mid-way leaves earlier lines done and says so. */
export async function transferStockAction(fromLocationId: string, _prev: TransferActionState, f: FormData): Promise<TransferActionState> {
  const { actor, stock } = await requireStockUser();
  const p = transferLinesSchema.safeParse({ toLocationId: text(f, "toLocationId"), lines: text(f, "lines") });
  if (!p.success) return { error: transferErrorMessage("INVALID_INPUT") };
  const { toLocationId, lines } = p.data;
  const tag = (i: number, msg: string) => (lines.length > 1 ? `Producto ${i + 1}: ${msg}` : msg);
  const fail = (e: unknown, i: number): TransferActionState => {
    if (e instanceof Forbidden) return { error: "No tienes permiso para hacer esto." };
    if (e instanceof NotFound) return { error: tag(i, "No encontramos el elemento. Recarga la página.") };
    return { error: tag(i, transferErrorMessage(e instanceof RuleViolation ? e.code : undefined)) };
  };
  if (lines.length > 1) {
    for (const [i, l] of lines.entries()) {
      try {
        const r = await stock.previewConsumption(actor, { productId: l.productId, locationId: fromLocationId, qty: l.qty, unit: l.unit, picks: l.picks });
        if (r.errors?.[0]) return { error: tag(i, r.errors[0] === "INSUFFICIENT_PACKS" && r.pack ? packShortageMessage(r.pack.name, r.pack.available) : transferErrorMessage(r.errors[0])) };
      } catch (e) {
        return fail(e, i);
      }
    }
  }
  let done = 0;
  for (const [i, l] of lines.entries()) {
    try {
      await stock.transferStock(actor, { productId: l.productId, fromLocationId, toLocationId, qty: l.qty, unit: l.unit, picks: l.picks, deviationReason: l.reason || undefined });
      done++;
    } catch (e) {
      if (done > 0) revalidatePath("/existencias", "layout");
      const r = fail(e, i);
      return done > 0 ? { error: `${r.error} Ya se trasladaron ${done} de ${lines.length} productos; revisa antes de repetir.` } : r;
    }
  }
  revalidatePath("/existencias", "layout");
  return {};
}
