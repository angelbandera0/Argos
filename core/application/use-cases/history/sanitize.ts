import type { HistoryEntry } from "@/core/application/ports/history-reader";

const SENSITIVE = /(^|[_-])(pin|password|credential)s?([_-]|$)/i;

export function stripSensitive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripSensitive);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([k]) => !SENSITIVE.test(k))
        .map(([k, v]) => [k, stripSensitive(v)]),
    );
  }
  return value;
}

const COST = /(^|_)(unit_cost|cost|costs|amount|amount_given|total|price|shortage_value)(_|$)/i;

export function stripCostValues(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripCostValues);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([k]) => !COST.test(k))
        .map(([k, v]) => [k, stripCostValues(v)]),
    );
  }
  return value;
}

export const sanitizeEntry = (e: HistoryEntry, seeCosts = false): HistoryEntry => {
  const clean = (v: unknown) => (seeCosts ? stripSensitive(v) : stripCostValues(stripSensitive(v)));
  return { ...e, before: clean(e.before), after: clean(e.after) };
};
