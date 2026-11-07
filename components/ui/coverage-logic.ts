import { formatQty, type BaseUnit } from "./quantity-logic";

export type Coverage = { state: "full" | "part" | "none"; ratio: number };

export function coverage(stock: number, needed: number): Coverage {
  if (stock <= 0) return { state: "none", ratio: 0 };
  if (stock >= needed) return { state: "full", ratio: 1 };
  return { state: "part", ratio: stock / needed };
}

export function coverageLabel(c: Coverage, stock: number, unit: BaseUnit) {
  return c.state === "full" ? "Cubre todo" : c.state === "part" ? `Cubre ${formatQty(stock, unit)}` : "Sin existencia";
}
