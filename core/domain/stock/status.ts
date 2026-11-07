import type { Qty } from "./quantity";

export type StockStatus = "normal" | "low" | "out";

export function stockStatus(quantity: Qty, minimum: Qty | null): StockStatus {
  if (quantity === 0) return "out";
  return minimum !== null && quantity <= minimum ? "low" : "normal";
}

export function crossedThreshold(prev: Qty, next: Qty, minimum: Qty | null): "low" | "out" | null {
  const was = stockStatus(prev, minimum);
  const now = stockStatus(next, minimum);
  return now !== "normal" && now !== was ? now : null;
}
