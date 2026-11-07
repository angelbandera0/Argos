import { z } from "zod";

const num = (v: unknown) => (typeof v === "string" ? (v.trim() === "" ? undefined : Number(v.replace(",", "."))) : v);
const positive = z.preprocess(num, z.number().finite().positive());
const reasonText = z.string().trim().min(1).max(300);

export const writeOffSchema = z
  .object({
    productId: z.string().min(1),
    qty: positive,
    unit: z.string().min(1),
    reasonId: z.string().min(1),
    requiresText: z.preprocess((v) => v === "true", z.boolean()),
    text: z.string().trim().max(300).optional(),
  })
  .refine((d) => !d.requiresText || !!d.text, { path: ["text"], message: "REASON_TEXT_REQUIRED" });

export const adjustSchema = z.object({
  lotId: z.string().min(1),
  delta: z.preprocess(num, z.number().finite().refine((n) => n !== 0)),
  text: reasonText,
});

export const surplusSchema = z.object({
  productId: z.string().min(1),
  qty: positive,
  text: reasonText,
  unitCost: z.preprocess(num, z.number().finite().min(0).optional()),
  currencyId: z.string().optional(),
});

export const reasonNameSchema = z.object({ name: z.string().trim().min(1).max(60) });

/** Machine code derived from a display name: lowercase, ascii, underscores, starts with a letter. */
export function reasonCode(name: string): string {
  const s = name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return (/^[a-z]/.test(s) ? s : `m_${s}`).slice(0, 40);
}

/** How much a lot can still be restored (up to its initial quantity) and discounted, in base units. */
export function adjustBounds(initialQty: number, remaining: number) {
  return { maxRestore: Math.max(0, Math.round((initialQty - remaining) * 1000) / 1000), maxDiscount: remaining };
}

export function adjustDeltaError(delta: number, initialQty: number, remaining: number): string | null {
  const { maxRestore, maxDiscount } = adjustBounds(initialQty, remaining);
  if (!Number.isFinite(delta) || delta === 0) return "Indica una cantidad distinta de cero.";
  if (delta > maxRestore) return "No puedes superar la cantidad inicial del lote.";
  if (-delta > maxDiscount) return "El lote no tiene tanta cantidad.";
  return null;
}

const ERRORS: Record<string, string> = {
  INVALID_INPUT: "Revisa los datos e inténtalo de nuevo.",
  INVALID_QUANTITY: "La cantidad debe ser válida y mayor que cero.",
  INVALID_UNIT: "Esa unidad no está disponible.",
  INSUFFICIENT_STOCK: "No hay existencias suficientes.",
  LOT_EXCEEDED: "Un lote no tiene tanta cantidad disponible.",
  LOT_NOT_FOUND: "No encontramos el lote. Actualiza la lista.",
  INVALID_REASON: "Ese motivo no está disponible.",
  REASON_TEXT_REQUIRED: "Este motivo exige una descripción.",
  PRODUCT_NOT_STORABLE: "Este producto no maneja existencias.",
  LOCATION_NOT_FOUND: "No encontramos la ubicación.",
  CODE_TAKEN: "Ya existe un motivo con ese nombre.",
  NAME_TAKEN: "Ya existe un motivo con ese nombre.",
  STANDARD_REASON: "Los motivos estándar no se pueden eliminar ni renombrar.",
  REASON_IN_USE: "El motivo ya tiene bajas registradas; desactívalo en su lugar.",
};

export const stockOpErrorMessage = (code?: string) => (code && ERRORS[code]) || "No se pudo completar la operación. Inténtalo de nuevo.";
