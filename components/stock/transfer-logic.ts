import { z } from "zod";
import { add, qty, type Qty } from "@/core/domain/stock";

const num = (v: unknown) => (typeof v === "string" ? (v.trim() === "" ? undefined : Number(v.replace(",", "."))) : v);
const pickSchema = z.object({ lotId: z.string().min(1), qty: z.number().finite().positive() });

export const transferSchema = z.object({
  productId: z.string().min(1),
  toLocationId: z.string().min(1),
  qty: z.preprocess(num, z.number().finite().positive()),
  unit: z.string().min(1),
  picks: z.preprocess((v) => (typeof v === "string" && v ? safeJson(v) : undefined), z.array(pickSchema).optional()),
  reason: z.string().trim().max(300).optional(),
});

function safeJson(v: string): unknown {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

export type LotPick = { lotId: string; qty: number };

/** Positive amounts typed per lot, as picks; blanks and non-positive values are dropped. */
export function picksFrom(values: Record<string, string>): LotPick[] {
  return Object.entries(values).flatMap(([lotId, raw]) => {
    const n = Number(raw.trim().replace(",", "."));
    return raw.trim() && n > 0 ? [{ lotId, qty: n }] : [];
  });
}

export const picksTotal = (picks: LotPick[]): Qty => picks.reduce((s, p) => add(s, qty(p.qty)), qty(0));

/** Remaining base amount (in thousandths-exact units) still to assign to lots; negative when over-assigned. */
export function pendingBase(picks: LotPick[], baseQty: number): number {
  return (qty(baseQty) - picksTotal(picks)) / 1000;
}

export type PreviewLot = { id: string; receivedAt: string; remaining: number; unitCost?: { amount: number; currencyId: string } | null };

export const suggestedValues = (suggested: LotPick[]): Record<string, string> => Object.fromEntries(suggested.map((p) => [p.lotId, String(p.qty)]));

const ERRORS: Record<string, string> = {
  INVALID_INPUT: "Revisa los datos e inténtalo de nuevo.",
  INVALID_QUANTITY: "La cantidad debe ser mayor que cero.",
  INVALID_UNIT: "Esa unidad no está disponible.",
  INSUFFICIENT_STOCK: "No hay existencias suficientes en el almacén.",
  LOT_EXCEEDED: "Un lote no tiene tanta cantidad disponible.",
  LOT_NOT_FOUND: "No encontramos uno de los lotes. Actualiza la lista.",
  DUPLICATE_LOT: "Un mismo lote está repetido.",
  QUANTITY_MISMATCH: "Los lotes elegidos deben sumar la cantidad a trasladar.",
  CHOOSE_LOT_FORBIDDEN: "No tienes permiso para elegir lotes distintos al más antiguo.",
  NOT_WAREHOUSE: "El traslado sale solo del almacén.",
  NOT_STORE: "El destino debe ser una tienda.",
  PRODUCT_NOT_STORABLE: "Este producto no maneja existencias.",
  LOCATION_NOT_FOUND: "No encontramos la ubicación.",
  REASON_TEXT_REQUIRED: "Indica el motivo de no seguir el lote más antiguo.",
};

export const transferErrorMessage = (code?: string) => (code && ERRORS[code]) || "No se pudo trasladar. Inténtalo de nuevo.";
