import { RuleViolation } from "@/core/domain/errors";
import { add, qty, sub, toNumber } from "@/core/domain/stock";

export type OrderStatus = "draft" | "open" | "in_review" | "fulfilled" | "returned" | "cancelled";
export type OrderDest = "warehouse" | "store" | "direct";

export interface StorePart {
  storeId: string;
  qty: number;
}

export const round2 = (n: number): number => Math.round((n + Number.EPSILON) * 100) / 100;

export interface Comparison {
  given: number | null;
  spent: number;
  leftover: number | null;
}

/** Delivered / spent / leftover; leftover is null when no amount was given (never an invented 0). */
export function comparison(given: number | null, lines: { qtyBought: number; unitCost: number }[]): Comparison {
  const spent = round2(lines.reduce((s, l) => s + l.qtyBought * l.unitCost, 0));
  return { given, spent, leftover: given === null ? null : round2(given - spent) };
}

/** Value of what was bought but not received; null when the unit cost is unknown. */
export function shortageValue(bought: number, received: number, unitCost: number | null): number | null {
  if (unitCost === null) return null;
  return round2(toNumber(sub(qty(bought), qty(received), true)) * unitCost);
}

export interface LineInput {
  dest: OrderDest;
  storeId?: string;
  qty: number;
  content: number;
  unit: string;
  plan?: StorePart[];
}

export function validateOrderLine(l: LineInput): void {
  if (qty(l.qty) <= 0) throw new RuleViolation("INVALID_QUANTITY");
  if (qty(l.content) <= 0) throw new RuleViolation("INVALID_CONTENT");
  if (!l.unit.trim()) throw new RuleViolation("INVALID_UNIT");
  if ((l.dest === "store") !== !!l.storeId) throw new RuleViolation("INVALID_INPUT");
  if (l.dest === "direct") {
    const total = (l.plan ?? []).reduce((s, p) => add(s, qty(p.qty)), qty(0));
    if (toNumber(total) !== toNumber(qty(l.qty))) throw new RuleViolation("PLAN_MISMATCH");
  }
}

/** A direct line that receives something must be split among stores and add up exactly. */
export function validateReparto(dest: OrderDest, received: number, reparto: StorePart[] | undefined): void {
  if (dest !== "direct" || received <= 0) return;
  const total = (reparto ?? []).reduce((s, p) => add(s, qty(p.qty)), qty(0));
  if (toNumber(total) === 0) throw new RuleViolation("REPARTO_REQUIRED");
  if (toNumber(total) !== toNumber(qty(received))) throw new RuleViolation("REPARTO_MISMATCH");
}
