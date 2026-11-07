import { z } from "zod";
import { format, mul, qty, toNumber } from "@/core/domain/stock";

const num = (v: unknown) => (typeof v === "string" ? (v.trim() === "" ? undefined : Number(v.replace(",", "."))) : v);
const positive = z.preprocess(num, z.number().finite().positive());
const optionalPositive = z.preprocess(num, z.number().finite().positive().optional());
const optionalCost = z.preprocess(num, z.number().finite().min(0).optional());

export const entrySchema = z.object({
  productId: z.string().min(1),
  qty: positive,
  unit: z.string().min(1),
  content: optionalPositive,
  cost: optionalCost,
  currencyId: z.string().optional(),
  unknownCost: z.boolean(),
});

export type EntryUnit = { value: string; label: string; factor: number };

/** Base-unit amount in exact thousandths; null when the input is not a positive number. */
export function baseAmount(amount: string, factor: number): number | null {
  try {
    const n = Number(amount.trim().replace(",", "."));
    if (!amount.trim() || !(n > 0)) return null;
    return toNumber(mul(qty(n), factor));
  } catch {
    return null;
  }
}

export const baseLabel = (unit: string) => (unit === "l" ? "L" : unit);

export function equivalentLabel(amount: string, factor: number, unit: string): string {
  const base = baseAmount(amount, factor);
  return base === null ? "" : `= ${format(qty(base))} ${baseLabel(unit)}`;
}

/** Cost per base unit shown under the price per presentation. */
export function costPerBaseLabel(cost: string, factor: number, unit: string, currency: string): string {
  const n = Number(cost.trim().replace(",", "."));
  if (!cost.trim() || !(n >= 0) || !(factor > 0)) return "";
  return `= ${new Intl.NumberFormat("es", { maximumFractionDigits: 4 }).format(n / factor)} ${currency} por ${baseLabel(unit)}`;
}

const ERRORS: Record<string, string> = {
  INVALID_INPUT: "Revisa los datos e inténtalo de nuevo.",
  INVALID_QUANTITY: "La cantidad debe ser mayor que cero.",
  INVALID_UNIT: "Esa presentación no está disponible.",
  INVALID_CONTENT: "El contenido debe ser mayor que cero.",
  PRODUCT_NOT_STORABLE: "Este producto no maneja existencias.",
  NOT_WAREHOUSE: "La entrada inicial solo se registra en el almacén.",
  NOT_STORE: "La entrada directa solo se registra en una tienda.",
  COST_NOT_ALLOWED: "No tienes permiso para registrar costos.",
  LOCATION_NOT_FOUND: "No encontramos la ubicación.",
};

export const entryErrorMessage = (code?: string) => (code && ERRORS[code]) || "No se pudo guardar. Inténtalo de nuevo.";
