import { z } from "zod";
import type { SelectOption } from "@/components/ui/select";
import { RuleViolation, convertUnits, format, magnitudeOf, mul, qty, toNumber, unitRatio, unitsOf, type Unit } from "@/core/domain/stock";

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
  newName: z.string().trim().optional(),
  newQty: optionalPositive,
  newUnit: z.string().optional(),
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

export const UNCONFIGURED_HINT = "Sin configurar para almacén";
export const UNCONFIGURED_NOTICE = "Este producto aún no se almacena. Elige su unidad base; se activará al registrar la entrada.";
export const DEFAULT_BASE_UNIT = "lb";
export const ENTRY_BASE_UNITS = ["lb", "kg", "g", "oz", "l", "ml", "u"].map((u) => ({ value: u, label: baseLabel(u) }));

export type EntryProductOption = { value: string; label: string; hint?: string; unconfigured?: boolean };

/** Storable products first; active products not yet storable follow (only offered to those who can configure units). */
export function entryProductOptions(
  products: { id: string; name: string; active: boolean }[],
  storableIds: Set<string>,
  canConfigure: boolean,
): EntryProductOption[] {
  const active = products.filter((p) => p.active);
  const ready = active.filter((p) => storableIds.has(p.id)).map((p) => ({ value: p.id, label: p.name }));
  if (!canConfigure) return ready;
  const pending = active.filter((p) => !storableIds.has(p.id)).map((p) => ({ value: p.id, label: p.name, hint: UNCONFIGURED_HINT, unconfigured: true }));
  return [...ready, ...pending];
}

export const STORABLE_LOCKED_TEXT = "No se puede desactivar porque el producto ya tiene movimientos.";

export const UNIT_PREFIX = "unit:";
export const NEW_PRESENTATION = "new";

const family = (base: string) => unitsOf(magnitudeOf(base as Unit));

/** Base unit, the rest of its family, existing presentations and (if allowed) "new presentation". */
export function entryUnitOptions(base: string, presentations: { name: string }[], canCreate: boolean): SelectOption[] {
  return [
    { value: "base", label: baseLabel(base) },
    ...family(base).filter((u) => u !== base).map((u) => ({ value: UNIT_PREFIX + u, label: baseLabel(u) })),
    ...presentations.map((p) => ({ value: p.name, label: p.name })),
    ...(canCreate ? [{ value: NEW_PRESENTATION, label: "Nueva presentación…" }] : []),
  ];
}

export const familyOptions = (base: string): SelectOption[] => family(base).map((u) => ({ value: u, label: baseLabel(u) }));

function familyUnit(unit: string, base: string): Unit {
  if (!family(base).includes(unit as Unit)) throw new RuleViolation("INVALID_UNIT");
  return unit as Unit;
}

/** Base units per one `unit` of the family (value from the selector). */
export const familyRatio = (value: string, base: string) => unitRatio(familyUnit(value.slice(UNIT_PREFIX.length), base), base as Unit);

/** Quantity and cost per base unit for an entry typed in another unit of the base's family. */
export function fromFamilyUnit(value: string, base: string, amount: number, cost?: number) {
  const ratio = familyRatio(value, base);
  return { qty: toNumber(mul(qty(amount), ratio)), unitCost: cost === undefined ? undefined : cost / ratio };
}

/** Content of a new presentation, in base units (thousandths). */
export const newPresentationContent = (contentQty: number, contentUnit: string, base: string) =>
  toNumber(convertUnits(contentQty, familyUnit(contentUnit, base), base as Unit));

/** "10 sacos × 25 kg = 250 kg = 551,160 lb" (the base total is what gets stored: amount × content). */
export function newPresentationSummary(amount: string, name: string, contentQty: string, contentUnit: string, base: string): string {
  const a = Number(amount.replace(",", ".")), c = Number(contentQty.replace(",", "."));
  if (!(a > 0) || !(c > 0) || !name.trim() || !family(base).includes(contentUnit as Unit)) return "";
  const n = (v: number) => new Intl.NumberFormat("es", { maximumFractionDigits: 3 }).format(v);
  const total = baseAmount(amount, newPresentationContent(c, contentUnit, base));
  return `${n(a)} ${name.trim()} × ${n(c)} ${baseLabel(contentUnit)} = ${n(toNumber(mul(qty(a), c)))} ${baseLabel(contentUnit)} = ${total === null ? "" : format(qty(total))} ${baseLabel(base)}`;
}
