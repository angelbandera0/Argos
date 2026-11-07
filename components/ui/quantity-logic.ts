export type BaseUnit = "lb" | "kg" | "L" | "g" | "u";

const DECIMALS: Record<BaseUnit, number> = { lb: 3, kg: 3, L: 3, g: 0, u: 0 };

export function unitDecimals(unit: BaseUnit) {
  return DECIMALS[unit];
}

export function toBase(qty: number, factor: number, unit: BaseUnit) {
  return Number((qty * factor).toFixed(DECIMALS[unit]));
}

export function formatQty(value: number, unit: BaseUnit) {
  const d = DECIMALS[unit];
  const n = new Intl.NumberFormat("es", { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: "always" }).format(value);
  return `${n} ${unit}`;
}

export function exceeds(base: number, available?: number) {
  return available !== undefined && base > available;
}

export function equivalentLine(qty: number, factor: number, unit: BaseUnit, available?: number) {
  const base = toBase(qty, factor, unit);
  return exceeds(base, available) ? `Solo hay ${formatQty(available as number, unit)}` : `= ${formatQty(base, unit)}`;
}
