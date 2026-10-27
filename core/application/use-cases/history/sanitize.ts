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

export const sanitizeEntry = (e: HistoryEntry): HistoryEntry => ({
  ...e,
  before: stripSensitive(e.before),
  after: stripSensitive(e.after),
});
