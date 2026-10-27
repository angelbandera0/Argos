export type Iso = string;
export type DateRange = { from: Iso; to: Iso };
export type DayCell = { iso: Iso; inMonth: boolean };
export type RangePreset = { id: string; label: string; from: Iso; to: Iso };

export const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
export const MONTHS = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const MONTHS_SHORT = MONTHS.map((m) => m.slice(0, 3));

const pad = (n: number, len = 2) => String(n).padStart(len, "0");

export function toIso(y: number, m: number, d: number): Iso {
  return `${pad(y, 4)}-${pad(m)}-${pad(d)}`;
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function parseIso(iso: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (y < 1000 || m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null;
  return { y, m, d };
}

export const isValidIso = (iso: string) => parseIso(iso) !== null;

export function todayIso(now: Date = new Date()): Iso {
  return toIso(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export const compareIso = (a: Iso, b: Iso) => (a < b ? -1 : a > b ? 1 : 0);

export function orderRange(a: Iso, b: Iso): DateRange {
  return compareIso(a, b) <= 0 ? { from: a, to: b } : { from: b, to: a };
}

export function clampIso(iso: Iso, min?: Iso, max?: Iso): Iso {
  if (min && iso < min) return min;
  if (max && iso > max) return max;
  return iso;
}

export const isDisabledDay = (iso: Iso, min?: Iso, max?: Iso) => (!!min && iso < min) || (!!max && iso > max);

export function normalizeRange(a: Iso, b: Iso, min?: Iso, max?: Iso): DateRange | null {
  if (!isValidIso(a) || !isValidIso(b)) return null;
  const r = orderRange(a, b);
  if ((min && r.to < min) || (max && r.from > max)) return null;
  return { from: clampIso(r.from, min, max), to: clampIso(r.to, min, max) };
}

export function isInRange(iso: Iso, from: Iso, to: Iso): boolean {
  return !!from && !!to && iso >= from && iso <= to;
}

export function addDays(iso: Iso, n: number): Iso {
  const p = parseIso(iso);
  if (!p) return iso;
  const t = new Date(Date.UTC(p.y, p.m - 1, p.d + n));
  return toIso(t.getUTCFullYear(), t.getUTCMonth() + 1, t.getUTCDate());
}

export function addMonths(iso: Iso, n: number): Iso {
  const p = parseIso(iso);
  if (!p) return iso;
  const idx = p.y * 12 + (p.m - 1) + n;
  const y = Math.floor(idx / 12);
  const m = (idx % 12) + 1;
  return toIso(y, m, Math.min(p.d, daysInMonth(y, m)));
}

export const addYears = (iso: Iso, n: number) => addMonths(iso, n * 12);

export function weekdayIndex(iso: Iso): number {
  const p = parseIso(iso);
  if (!p) return 0;
  return (new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay() + 6) % 7;
}

export const startOfWeek = (iso: Iso) => addDays(iso, -weekdayIndex(iso));
export const endOfWeek = (iso: Iso) => addDays(iso, 6 - weekdayIndex(iso));
export const startOfMonth = (iso: Iso) => iso.slice(0, 8) + "01";

export function endOfMonth(iso: Iso): Iso {
  const p = parseIso(iso);
  return p ? toIso(p.y, p.m, daysInMonth(p.y, p.m)) : iso;
}

export function monthMatrix(y: number, m: number): DayCell[][] {
  const first = toIso(y, m, 1);
  const start = startOfWeek(first);
  const monthPrefix = first.slice(0, 7);
  return Array.from({ length: 6 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const iso = addDays(start, w * 7 + d);
      return { iso, inMonth: iso.startsWith(monthPrefix) };
    }),
  );
}

export function rangeDays(from: Iso, to: Iso): number {
  const a = parseIso(from);
  const b = parseIso(to);
  if (!a || !b) return 0;
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86_400_000) + 1;
}

export function formatDisplay(iso: Iso): string {
  const p = parseIso(iso);
  return p ? `${pad(p.d)}/${pad(p.m)}/${pad(p.y, 4)}` : "";
}

export function parseDisplay(text: string): Iso | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(text.trim());
  if (!match) return null;
  const iso = toIso(Number(match[3]), Number(match[2]), Number(match[1]));
  return isValidIso(iso) ? iso : null;
}

export function maskDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function formatLong(iso: Iso, today?: Iso): string {
  const p = parseIso(iso);
  if (!p) return "";
  return `${p.d} de ${MONTHS[p.m - 1]} de ${p.y}${iso === today ? ", hoy" : ""}`;
}

export function formatShortRange(from: Iso, to: Iso): string {
  const a = parseIso(from);
  const b = parseIso(to);
  if (!a || !b) return "";
  const day = (p: { y: number; m: number; d: number }, withMonth: boolean, withYear: boolean) =>
    `${p.d}${withMonth ? ` ${MONTHS_SHORT[p.m - 1]}` : ""}${withYear ? ` ${p.y}` : ""}`;
  if (from === to) return day(a, true, true);
  const sameMonth = a.y === b.y && a.m === b.m;
  const sameYear = a.y === b.y;
  return `${day(a, !sameMonth, !sameYear)} – ${day(b, true, true)}`;
}

export function monthTitle(y: number, m: number): string {
  const name = MONTHS[m - 1];
  return `${name[0].toUpperCase()}${name.slice(1)} ${y}`;
}

export function presetRanges(base: Iso): RangePreset[] {
  const prevMonthEnd = addDays(startOfMonth(base), -1);
  return [
    { id: "hoy", label: "Hoy", from: base, to: base },
    { id: "ayer", label: "Ayer", from: addDays(base, -1), to: addDays(base, -1) },
    { id: "7d", label: "Últimos 7 días", from: addDays(base, -6), to: base },
    { id: "30d", label: "Últimos 30 días", from: addDays(base, -29), to: base },
    { id: "mes", label: "Este mes", from: startOfMonth(base), to: base },
    { id: "mes-pasado", label: "Mes pasado", from: startOfMonth(prevMonthEnd), to: prevMonthEnd },
  ];
}

export function pickRangeDay(draft: DateRange, iso: Iso): DateRange {
  if (!draft.from || draft.to) return { from: iso, to: "" };
  return orderRange(draft.from, iso);
}

export function typedRangeError(from: Iso, to: Iso): boolean {
  return !!from && !!to && from > to;
}
