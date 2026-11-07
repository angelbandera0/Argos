export type Currency = { code: string; decimals: number };

export function formatMoney(value: number, c: Currency, signed = false) {
  const n = new Intl.NumberFormat("es", { minimumFractionDigits: c.decimals, maximumFractionDigits: c.decimals, useGrouping: "always" }).format(Math.abs(value));
  const sign = value < 0 ? "−" : signed && value > 0 ? "+" : "";
  return `${sign}${n} ${c.code}`;
}

export function surplus(delivered: number, spent: number, c: Currency) {
  return Number((delivered - spent).toFixed(c.decimals));
}

export function barPercent(amount: number, max: number) {
  return max > 0 ? Math.round((amount / max) * 100) : 0;
}
