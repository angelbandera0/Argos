import { RuleViolation } from "../errors";
import { add, compare, sub, type Qty } from "./quantity";
import type { Allocation, Lot } from "./lot";

const time = (l: Lot) => new Date(l.createdAt).getTime();
const total = (xs: Qty[]) => xs.reduce((s, q) => add(s, q), 0 as Qty);

export function suggestFifo(lots: Lot[], needed: Qty): Allocation[] {
  const usable = lots.filter((l) => l.remaining > 0).sort((a, b) => time(a) - time(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  if (needed > total(usable.map((l) => l.remaining))) throw new RuleViolation("INSUFFICIENT_STOCK");
  const out: Allocation[] = [];
  let left = needed;
  for (const lot of usable) {
    if (left <= 0) break;
    const q = (lot.remaining < left ? lot.remaining : left) as Qty;
    out.push({ lotId: lot.id, qty: q });
    left = sub(left, q);
  }
  return out;
}

export function allocateChosen(lots: Lot[], picks: { lotId: string; qty: Qty }[], needed: Qty): Allocation[] {
  if (needed > total(lots.map((l) => l.remaining))) throw new RuleViolation("INSUFFICIENT_STOCK");
  const seen = new Set<string>();
  for (const p of picks) {
    const lot = lots.find((l) => l.id === p.lotId);
    if (!lot) throw new RuleViolation("LOT_NOT_FOUND");
    if (p.qty <= 0 || seen.has(p.lotId)) throw new RuleViolation("INVALID_INPUT");
    seen.add(p.lotId);
    if (p.qty > lot.remaining) throw new RuleViolation("LOT_EXCEEDED");
  }
  if (compare(total(picks.map((p) => p.qty)), needed) !== 0) throw new RuleViolation("QUANTITY_MISMATCH");
  return picks.map((p) => ({ lotId: p.lotId, qty: p.qty }));
}

export function isFifoDeviation(lots: Lot[], allocations: Allocation[], needed: Qty): boolean {
  const suggested = new Map(suggestFifo(lots, needed).map((a) => [a.lotId, a.qty]));
  const chosen = allocations.filter((a) => a.qty > 0);
  return chosen.length !== suggested.size || chosen.some((a) => suggested.get(a.lotId) !== a.qty);
}

export function applyAllocations(lots: Lot[], allocations: Allocation[]): Lot[] {
  for (const a of allocations) if (!lots.some((l) => l.id === a.lotId)) throw new RuleViolation("LOT_NOT_FOUND");
  return lots.map((l) => {
    const used = total(allocations.filter((a) => a.lotId === l.id).map((a) => a.qty));
    if (used > l.remaining) throw new RuleViolation("LOT_EXCEEDED");
    return { ...l, remaining: sub(l.remaining, used) };
  });
}
