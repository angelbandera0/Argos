import { addDays, MONTHS, parseIso, weekdayIndex, type Iso } from "@/components/ui/datepicker-utils";

const DAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const formatters = new Map<string, Intl.DateTimeFormat>();
let supported: Set<string> | null = null;

function formatter(tz: string) {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
    formatters.set(tz, f);
  }
  return f;
}

/** Calendar day (ISO) of an instant in the given zone. */
export function dayKey(date: Date, tz: string): Iso {
  const p = Object.fromEntries(formatter(tz).formatToParts(date).map((x) => [x.type, x.value]));
  return `${p.year.padStart(4, "0")}-${p.month}-${p.day}`;
}

function firstInstantOf(iso: Iso, tz: string, noonUtc: number): number {
  let lo = noonUtc - 36 * 3_600_000;
  let hi = noonUtc;
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if (dayKey(new Date(mid), tz) >= iso) hi = mid;
    else lo = mid;
  }
  return hi;
}

/** `[start, end)` instants of a calendar day in a zone (handles DST gaps, 23/25 h days and half-hour offsets). */
export function dayBoundsInTimeZone(iso: Iso, tz: string): { start: Date; end: Date } {
  const p = parseIso(iso);
  if (!p) throw new RangeError(`invalid ISO day: ${iso}`);
  const noon = Date.UTC(p.y, p.m - 1, p.d, 12);
  return {
    start: new Date(firstInstantOf(iso, tz, noon)),
    end: new Date(firstInstantOf(addDays(iso, 1), tz, noon + 86_400_000)),
  };
}

export function isValidTimeZone(raw: string | undefined): raw is string {
  if (!raw || raw.length > 64 || !/^[A-Za-z0-9_+\-/]+$/.test(raw)) return false;
  supported ??= new Set([...Intl.supportedValuesOf("timeZone"), "UTC"]);
  if (supported.has(raw)) return true;
  try {
    formatter(raw);
    return true;
  } catch {
    return false;
  }
}

/** The `tz` cookie when valid; otherwise UTC and `assumed: true`. */
export function resolveTimeZone(raw: string | undefined): { tz: string; assumed: boolean } {
  return isValidTimeZone(raw) ? { tz: raw, assumed: false } : { tz: "UTC", assumed: true };
}

export function dayHeading(iso: Iso, today: Iso): string {
  const p = parseIso(iso);
  if (!p) return iso;
  const prefix = iso === today ? "Hoy · " : iso === addDays(today, -1) ? "Ayer · " : "";
  const year = iso.slice(0, 4) === today.slice(0, 4) ? "" : ` de ${p.y}`;
  return `${prefix}${DAY_NAMES[weekdayIndex(iso)]} ${p.d} de ${MONTHS[p.m - 1]}${year}`;
}

/** Groups newest-first rows by calendar day in the user's zone; keeps the incoming order. */
export function groupByDay<T extends { createdAt: string }>(rows: T[], tz: string, now: Date = new Date()) {
  const today = dayKey(now, tz);
  const groups: { key: Iso; label: string; rows: T[] }[] = [];
  for (const r of rows) {
    const key = dayKey(new Date(r.createdAt), tz);
    const last = groups[groups.length - 1];
    if (last?.key === key) last.rows.push(r);
    else groups.push({ key, label: dayHeading(key, today), rows: [r] });
  }
  return groups;
}

/** Day range (inclusive ISO days) to `[from, to)` instants in the zone; either end may be missing. */
export function rangeToInstants(from: Iso | undefined, to: Iso | undefined, tz: string): { from?: Date; to?: Date } {
  return { from: from ? dayBoundsInTimeZone(from, tz).start : undefined, to: to ? dayBoundsInTimeZone(to, tz).end : undefined };
}
