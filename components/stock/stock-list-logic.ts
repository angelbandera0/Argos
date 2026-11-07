import type { LotView } from "@/core/application/ports/stock-repository";
import type { StockStatus, Unit } from "@/core/domain/stock";

export const PAGE_SIZE = 10;

export type StatusFilter = "todos" | StockStatus;
export type StockFilters = { ubicacion: string; q: string; categoria: string; estado: StatusFilter; pagina: number };

export const statusParam = (s: StockStatus) => PARAM_OF[s];
const PARAM_OF: Record<StockStatus, string> = { normal: "normal", low: "bajo", out: "agotado" };

export const parseStatus = (v: unknown): StatusFilter => (Object.keys(PARAM_OF) as StockStatus[]).find((s) => PARAM_OF[s] === v) ?? "todos";

export const parsePage = (v: unknown) => {
  const n = typeof v === "string" ? Number.parseInt(v, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
};

export function stockListQuery(f: Partial<StockFilters>): string {
  const sp = new URLSearchParams();
  if (f.ubicacion) sp.set("ubicacion", f.ubicacion);
  if (f.q) sp.set("q", f.q);
  if (f.categoria) sp.set("categoria", f.categoria);
  if (f.estado && f.estado !== "todos") sp.set("estado", PARAM_OF[f.estado]);
  if (f.pagina && f.pagina > 1) sp.set("pagina", String(f.pagina));
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

const NO_DECIMALS: Unit[] = ["g", "ml", "u"];

export function formatStockQty(value: number, unit: Unit) {
  const d = NO_DECIMALS.includes(unit) ? 0 : 3;
  const n = new Intl.NumberFormat("es", { minimumFractionDigits: d, maximumFractionDigits: d, useGrouping: "always" }).format(value);
  return `${n} ${unit === "l" ? "L" : unit}`;
}

export const minimumLabel = (minimum: number | null, unit: Unit) => (!minimum ? "Sin mínimo" : formatStockQty(minimum, unit));

export type LotValue = { currencyId: string; value: number; qty: number };
export type ProductValue = { byCurrency: LotValue[]; unknownQty: number };

/** Value of the lots with a known cost, per currency; quantity without a known cost aside. */
export function lotsValue(lots: Pick<LotView, "remaining" | "unitCost">[]): ProductValue {
  const by = new Map<string, LotValue>();
  let unknownQty = 0;
  for (const l of lots) {
    if (!l.unitCost) {
      unknownQty += l.remaining;
      continue;
    }
    const cur = by.get(l.unitCost.currencyId) ?? { currencyId: l.unitCost.currencyId, value: 0, qty: 0 };
    cur.value += l.remaining * l.unitCost.amount;
    cur.qty += l.remaining;
    by.set(l.unitCost.currencyId, cur);
  }
  return { byCurrency: [...by.values()], unknownQty };
}

export function groupLotsByProduct<T extends { productId: string }>(lots: T[]) {
  const map = new Map<string, T[]>();
  for (const l of lots) map.set(l.productId, [...(map.get(l.productId) ?? []), l]);
  return map;
}

/** Average cost per base unit for one currency (first one when several). */
export const averageCost = (v: ProductValue) => (v.byCurrency[0] ? { currencyId: v.byCurrency[0].currencyId, amount: v.byCurrency[0].value / v.byCurrency[0].qty } : null);

export const unknownCostLabel = (n: number) => (n === 0 ? null : n === 1 ? "1 producto sin costo conocido" : `${n} productos sin costo conocido`);

export function sumByCurrency(values: { currencyId: string; value: number }[]) {
  const by = new Map<string, number>();
  for (const v of values) by.set(v.currencyId, (by.get(v.currencyId) ?? 0) + v.value);
  return [...by].map(([currencyId, amount]) => ({ currencyId, amount }));
}

/** Quantity missing to reach the minimum; null when there is no minimum or it is covered. */
export const shortfall = (quantity: number, minimum: number | null) => (minimum && minimum > 0 && quantity < minimum ? minimum - quantity : null);

export const shortfallLabel = (quantity: number, minimum: number | null, unit: Unit) => {
  const s = shortfall(quantity, minimum);
  return s === null ? null : `Faltan ${formatStockQty(s, unit)} para el mínimo`;
};
