import { z } from "zod";
import { formatMoney } from "@/components/ui/spend-logic";

const num = (v: unknown) => (typeof v === "string" ? (v.trim() === "" ? undefined : Number(v.replace(",", "."))) : v);

export const hasAtMostSixDecimals = (n: number) => Number.isFinite(n) && Math.round(n * 1e6) / 1e6 === n;

export const costAdjustSchema = z.object({
  lotId: z.string().min(1),
  newUnitCost: z.preprocess(num, z.number().finite().min(0).refine(hasAtMostSixDecimals)),
  text: z.string().trim().min(3).max(300),
});

/** Inline error for the typed cost; null while empty or valid. */
export function costInputError(raw: string): string | null {
  if (!raw.trim()) return null;
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n) || n < 0) return "Escribe un costo válido, mayor o igual que cero.";
  if (!hasAtMostSixDecimals(n)) return "Máximo 6 decimales.";
  return null;
}

/** «De X a Y», or null when the typed value is not a valid cost. */
export function costSummary(oldCost: number, raw: string, code: string): string | null {
  if (!raw.trim() || costInputError(raw)) return null;
  const c = { code, decimals: 6 };
  return `De ${formatMoney(oldCost, c)} a ${formatMoney(Number(raw.replace(",", ".")), c)}`;
}

/** The action needs a known cost and currency (the database answers CURRENCY_REQUIRED otherwise). */
export const canCorrectLotCost = (unitCost: number | null | undefined) => unitCost !== null && unitCost !== undefined;
