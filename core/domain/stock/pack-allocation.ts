import { RuleViolation } from "../errors";
import { add, mul, type Qty } from "./quantity";
import type { Presentation } from "./presentation";

export type PackLot = { id: string; createdAt: Date | string; remaining: Qty; presentation: Presentation | null };
export type PackAllocation = { lotId: string; packs: number; qty: Qty };

const key = (s: string) => s.trim().toLowerCase();
const time = (l: PackLot) => new Date(l.createdAt).getTime();
const whole = (n: number) => Number.isInteger(n) && n > 0;

/** Complete packs of the named presentation per lot, oldest first; lots without that presentation (bulk or another) have none. */
export function packsPerLot(lots: PackLot[], name: string) {
  return lots
    .filter((l) => l.remaining > 0 && l.presentation && l.presentation.content > 0 && key(l.presentation.name) === key(name))
    .sort((a, b) => time(a) - time(b) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((l) => ({ lot: l, content: l.presentation!.content, available: Math.floor(l.remaining / l.presentation!.content) }))
    .filter((x) => x.available > 0);
}

export const availablePacks = (lots: PackLot[], name: string) => packsPerLot(lots, name).reduce((s, x) => s + x.available, 0);

/** Takes `count` whole packs from the oldest lots; each lot counts with its own content. */
export function suggestPacksFifo(lots: PackLot[], name: string, count: number): PackAllocation[] {
  if (!whole(count)) throw new RuleViolation("INVALID_QUANTITY");
  const out: PackAllocation[] = [];
  let left = count;
  for (const x of packsPerLot(lots, name)) {
    if (left <= 0) break;
    const packs = Math.min(x.available, left);
    out.push({ lotId: x.lot.id, packs, qty: mul(x.content, packs) });
    left -= packs;
  }
  if (left > 0) throw new RuleViolation("INSUFFICIENT_PACKS");
  return out;
}

/** Validates packs chosen per lot against what each lot has and converts them with the lot's content. */
export function allocateChosenPacks(lots: PackLot[], name: string, picks: { lotId: string; packs: number }[], count: number): PackAllocation[] {
  if (!whole(count)) throw new RuleViolation("INVALID_QUANTITY");
  const usable = new Map(packsPerLot(lots, name).map((x) => [x.lot.id, x]));
  const seen = new Set<string>();
  let total = 0;
  const out = picks.map((p) => {
    const x = usable.get(p.lotId);
    if (!x) throw new RuleViolation("LOT_NOT_FOUND");
    if (!whole(p.packs) || seen.has(p.lotId)) throw new RuleViolation("INVALID_QUANTITY");
    seen.add(p.lotId);
    if (p.packs > x.available) throw new RuleViolation("LOT_EXCEEDED");
    total += p.packs;
    return { lotId: p.lotId, packs: p.packs, qty: mul(x.content, p.packs) };
  });
  if (total !== count) throw new RuleViolation("QUANTITY_MISMATCH");
  return out;
}

export const totalQty = (xs: PackAllocation[]) => xs.reduce((s, a) => add(s, a.qty), 0 as Qty);

export function isPackDeviation(lots: PackLot[], name: string, chosen: PackAllocation[], count: number): boolean {
  const suggested = new Map(suggestPacksFifo(lots, name, count).map((a) => [a.lotId, a.packs]));
  const picked = chosen.filter((a) => a.packs > 0);
  return picked.length !== suggested.size || picked.some((a) => suggested.get(a.lotId) !== a.packs);
}
