import { RuleViolation } from "../errors";

export type Qty = number & { readonly __qty: unique symbol };

const SCALE = 1000;

const roundHalfUp = (n: number) => Math.floor(Number(n.toPrecision(12)) + 0.5);
const make = (milli: number) => milli as Qty;

export function qty(n: number | string, signed = false): Qty {
  const v = typeof n === "string" ? Number(n.trim().replace(",", ".")) : n;
  if (typeof n === "string" && n.trim() === "") throw new RuleViolation("INVALID_QUANTITY");
  if (!Number.isFinite(v)) throw new RuleViolation("INVALID_QUANTITY");
  if (v < 0 && !signed) throw new RuleViolation("NEGATIVE_QUANTITY");
  return make(roundHalfUp(v * SCALE));
}

export const toNumber = (q: Qty) => q / SCALE;
export const add = (a: Qty, b: Qty) => make(a + b);

export function sub(a: Qty, b: Qty, signed = false): Qty {
  if (a < b && !signed) throw new RuleViolation("NEGATIVE_QUANTITY");
  return make(a - b);
}

export function mul(q: Qty, factor: number): Qty {
  if (!Number.isFinite(factor) || factor < 0) throw new RuleViolation("INVALID_QUANTITY");
  return make(roundHalfUp(q * factor));
}

export function div(a: Qty, b: Qty): Qty {
  if (b <= 0) throw new RuleViolation("INVALID_QUANTITY");
  return make(roundHalfUp((a * SCALE) / b));
}

export const compare = (a: Qty, b: Qty) => (a < b ? -1 : a > b ? 1 : 0);
export const isZero = (q: Qty) => q === 0;
export const isNegative = (q: Qty) => q < 0;

export function format(q: Qty, locale = "es") {
  return toNumber(q).toLocaleString(locale, { minimumFractionDigits: 3, maximumFractionDigits: 3, useGrouping: "min2" });
}
