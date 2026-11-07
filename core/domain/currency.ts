import { RuleViolation } from "./errors";
import { normalizeName } from "./name";

export const DENOMINATION_KINDS = ["bill", "coin"] as const;
export type DenominationKind = (typeof DENOMINATION_KINDS)[number];

function bounded(raw: string, max: number): string {
  const text = normalizeName(raw);
  if (text.length < 1 || text.length > max) throw new RuleViolation("INVALID_INPUT");
  return text;
}

export const validateCurrencyCode = (raw: string) => bounded(raw, 10);
export const validateCurrencySymbol = (raw: string) => bounded(raw, 8);

export function validateDecimals(n: number): number {
  if (!Number.isInteger(n) || n < 0 || n > 4) throw new RuleViolation("INVALID_INPUT");
  return n;
}

export function validateDenomination(i: { value: number; kind: string }): { value: number; kind: DenominationKind } {
  return { value: validateDenominationValue(i.value), kind: validateKind(i.kind) };
}

export function validateDenominationValue(value: number): number {
  if (!Number.isFinite(value) || value <= 0) throw new RuleViolation("INVALID_INPUT");
  return value;
}

export function validateKind(kind: string): DenominationKind {
  if (!(DENOMINATION_KINDS as readonly string[]).includes(kind)) throw new RuleViolation("INVALID_INPUT");
  return kind as DenominationKind;
}
