import { add, qty, stockByPresentation, toNumber, type Unit } from "@/core/domain/stock";
import { formatStockQty } from "./stock-list-logic";

export type PresentationRef = { name: string; content: number };
export type PresentedLot = { remaining: number; presentation: PresentationRef | null };

const plain = (n: number) => new Intl.NumberFormat("es", { maximumFractionDigits: 3 }).format(n);
const unitLabel = (u: Unit) => (u === "l" ? "L" : u);

export function pluralName(name: string, n: number) {
  const w = name.trim().toLowerCase();
  return n === 1 ? w : /[aeiouáéíóú]$/.test(w) ? `${w}s` : `${w}es`;
}

const completeWord = (name: string, loose: boolean) => (!loose ? "" : /a$/i.test(name.trim()) ? " completas" : " completos");

/** «20 sacos» / «19 sacos completos + 10 lb sueltas» and the base total; null when no lot has a presentation. */
export function presentationStock(lots: PresentedLot[], unit: Unit): { main: string; base: string } | null {
  const s = stockByPresentation(
    lots.map((l) => ({ remaining: qty(l.remaining), presentation: l.presentation && { name: l.presentation.name, content: qty(l.presentation.content) } })),
  );
  if (s.presentations.length === 0) return null;
  const loose = s.presentations.reduce((a, g) => add(a, g.loose), s.bulk);
  const parts = s.presentations.map((g) => `${g.complete} ${pluralName(g.name, g.complete)}${completeWord(g.name, loose > 0)}`);
  if (loose > 0) parts.push(`${formatStockQty(toNumber(loose), unit)} sueltas`);
  return { main: parts.join(" + "), base: formatStockQty(toNumber(s.total), unit) };
}

/** «20 sacos de 40 lb» for what entered, and the same breakdown for what remains. */
export function lotPresentation(l: { initialQty: number; remaining: number; presentation: PresentationRef | null }, unit: Unit) {
  if (!l.presentation) return null;
  const p = l.presentation;
  const n = Math.round((l.initialQty / p.content) * 1000) / 1000;
  return {
    entered: `${plain(n)} ${pluralName(p.name, n)} de ${plain(p.content)} ${unitLabel(unit)}`,
    remaining: presentationStock([{ remaining: l.remaining, presentation: p }], unit)?.main ?? "",
  };
}
