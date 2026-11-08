import { z } from "zod";
import { add, magnitudeOf, qty, unitRatio, unitsOf, type Qty, type Unit } from "@/core/domain/stock";

const num = (v: unknown) => (typeof v === "string" ? (v.trim() === "" ? undefined : Number(v.replace(",", "."))) : v);
const pickSchema = z.object({ lotId: z.string().min(1), qty: z.number().finite().positive() });

export const picksField = z.preprocess((v) => (typeof v === "string" && v ? safeJson(v) : undefined), z.array(pickSchema).optional());

export const transferSchema = z.object({
  productId: z.string().min(1),
  toLocationId: z.string().min(1),
  qty: z.preprocess(num, z.number().finite().positive()),
  unit: z.string().min(1),
  picks: picksField,
  reason: z.string().trim().max(300).optional(),
});

export const transferLineSchema = z.object({
  productId: z.string().min(1),
  qty: z.number().finite().positive(),
  unit: z.string().min(1),
  picks: z.array(pickSchema).optional(),
  reason: z.string().trim().max(300).optional(),
});

export const transferLinesSchema = z.object({
  toLocationId: z.string().min(1),
  lines: z.preprocess((v) => (typeof v === "string" && v ? safeJson(v) : null), z.array(transferLineSchema).min(1).max(50)),
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

export type PreviewLot = { id: string; receivedAt: string; remaining: number; presentation?: { name: string; content: number } | null; unitCost?: { amount: number; currencyId: string } | null };

/** Value moved by an allocation per currency; null when costs are hidden, `unknown` when some lot has no known cost. */
export function allocationValue(lots: PreviewLot[], allocation: LotPick[]): { byCurrency: { currencyId: string; amount: number }[]; unknown: boolean } | null {
  if (lots.some((l) => l.unitCost === undefined)) return null;
  const totals = new Map<string, number>();
  let unknown = false;
  for (const a of allocation) {
    const cost = lots.find((l) => l.id === a.lotId)?.unitCost;
    if (!cost) {
      unknown = true;
      continue;
    }
    totals.set(cost.currencyId, (totals.get(cost.currencyId) ?? 0) + a.qty * cost.amount);
  }
  return { byCurrency: [...totals].map(([currencyId, amount]) => ({ currencyId, amount })), unknown };
}

export const suggestedValues = (suggested: LotPick[]): Record<string, string> => Object.fromEntries(suggested.map((p) => [p.lotId, String(p.qty)]));

const ERRORS: Record<string, string> = {
  INVALID_INPUT: "Revisa los datos e inténtalo de nuevo.",
  INVALID_QUANTITY: "La cantidad debe ser mayor que cero.",
  INVALID_UNIT: "Esa unidad no está disponible.",
  INSUFFICIENT_STOCK: "No hay existencias suficientes en el almacén.",
  INSUFFICIENT_PACKS: "No hay presentaciones completas suficientes.",
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

export type MoveUnitOption = { value: string; label: string; factor: number; kind?: "presentation" | "movement" };

const plainNum = (n: number) => new Intl.NumberFormat("es", { maximumFractionDigits: 3 }).format(n);
const unitName = (u: string) => (u === "l" ? "L" : u);

/** What a quantity can be moved in: the base unit, presentations, movement units and the rest of the base unit's family. */
export function moveUnitOptions(c: { baseUnit: string; presentations: { name: string; content: number }[]; units: { name: string; equivalence: number }[] }): MoveUnitOption[] {
  const base = c.baseUnit as Unit;
  const sized = (name: string, f: number, kind: "presentation" | "movement"): MoveUnitOption => ({ value: name, label: `${name} (${plainNum(f)} ${unitName(base)})`, factor: f, kind });
  return [
    { value: "base", label: unitName(base), factor: 1 },
    ...c.presentations.map((p) => sized(p.name, p.content, "presentation")),
    ...c.units.map((u) => sized(u.name, u.equivalence, "movement")),
    ...unitsOf(magnitudeOf(base))
      .filter((u) => u !== base)
      .map((u) => ({ value: u, label: unitName(u), factor: unitRatio(u, base) })),
  ];
}

/** «= 200 lb» under the quantity; undefined for the base unit or an empty amount. */
export function moveEquivalent(options: MoveUnitOption[], unit: string, amount: string, baseUnit: string): string | undefined {
  const o = options.find((x) => x.value === unit);
  const n = Number(amount.replace(",", "."));
  if (!o || unit === "base" || !(n > 0)) return undefined;
  return `= ${plainNum(Math.round(n * o.factor * 1000) / 1000)} ${unitName(baseUnit)}`;
}

const countWord = (name: string, n: number) => {
  const w = name.trim().toLowerCase();
  return n === 1 ? w : /[aeiouáéíóú]$/.test(w) ? `${w}s` : `${w}es`;
};

/** «Solo hay 3 sacos completos.» when the request needs more whole packs than the lots hold. */
export function packShortageMessage(name: string, available: number): string {
  const complete = /a$/i.test(name.trim()) ? "completas" : "completos";
  return available === 0 ? `No hay ${countWord(name, 2)} ${complete} disponibles.` : `Solo hay ${available} ${countWord(name, available)} ${complete}.`;
}

/** «3 sacos del lote a1b2c3d4 (40 lb) + 2 del lote e5f6a7b8 (25 lb) = 170 lb» from packs taken per lot. */
export function packBreakdown(lots: PreviewLot[], packs: LotPick[], name: string, baseUnit: string): string {
  const parts = packs.map((p, i) => {
    const lot = lots.find((l) => l.id === p.lotId);
    const content = lot?.presentation?.content ?? 0;
    const head = i === 0 ? `${plainNum(p.qty)} ${countWord(name, p.qty)}` : plainNum(p.qty);
    return `${head} del lote ${p.lotId.slice(0, 8)} (${plainNum(content)} ${unitName(baseUnit)})`;
  });
  const total = packs.reduce((s, p) => s + p.qty * (lots.find((l) => l.id === p.lotId)?.presentation?.content ?? 0), 0);
  return `${parts.join(" + ")} = ${plainNum(Math.round(total * 1000) / 1000)} ${unitName(baseUnit)}`;
}

