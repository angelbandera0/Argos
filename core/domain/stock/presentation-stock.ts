import { add, qty, sub, type Qty } from "./quantity";
import type { Presentation } from "./presentation";

export type LotStock = { remaining: Qty; presentation: Presentation | null };
export type PresentationStock = { name: string; content: Qty; complete: number; loose: Qty; total: Qty };
export type StockByPresentation = { total: Qty; presentations: PresentationStock[]; bulk: Qty };

export function stockByPresentation(lots: LotStock[]): StockByPresentation {
  const groups = new Map<string, PresentationStock>();
  let bulk = qty(0);
  let total = qty(0);
  for (const { remaining, presentation } of lots) {
    if (remaining <= 0) continue;
    total = add(total, remaining);
    if (!presentation || presentation.content <= 0) {
      bulk = add(bulk, remaining);
      continue;
    }
    const complete = Math.floor(remaining / presentation.content);
    const loose = sub(remaining, (complete * presentation.content) as Qty);
    const key = `${presentation.name.trim().toLowerCase()}|${presentation.content}`;
    const g = groups.get(key) ?? { name: presentation.name, content: presentation.content, complete: 0, loose: qty(0), total: qty(0) };
    g.complete += complete;
    g.loose = add(g.loose, loose);
    g.total = add(g.total, remaining);
    groups.set(key, g);
  }
  return { total, presentations: [...groups.values()], bulk };
}
