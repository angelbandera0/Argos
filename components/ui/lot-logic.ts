export type Lot = { id: string; code: string; meta: string; remaining: number; cost?: string };
export type Allocation = Record<string, number>;

const round = (n: number) => Number(n.toFixed(3));

export function suggestedAllocation(lots: Lot[], needed: number): Allocation {
  let left = needed;
  const out: Allocation = {};
  for (const lot of lots) {
    const q = round(Math.min(lot.remaining, left));
    out[lot.id] = q;
    left = round(left - q);
  }
  return out;
}

export function allocated(alloc: Allocation) {
  return round(Object.values(alloc).reduce((s, q) => s + q, 0));
}

export function setLotQty(alloc: Allocation, lots: Lot[], needed: number, id: string, qty: number): Allocation {
  const lot = lots.find((l) => l.id === id);
  if (!lot) return alloc;
  const others = allocated({ ...alloc, [id]: 0 });
  const max = Math.max(0, Math.min(lot.remaining, round(needed - others)));
  return { ...alloc, [id]: Math.min(Math.max(0, Number.isFinite(qty) ? qty : 0), max) };
}

export function isBalanced(alloc: Allocation, needed: number) {
  return allocated(alloc) === round(needed);
}

export function isSuggested(alloc: Allocation, lots: Lot[], needed: number) {
  const s = suggestedAllocation(lots, needed);
  return lots.every((l) => (alloc[l.id] ?? 0) === s[l.id]);
}
