import { RuleViolation } from "./errors";

export const MAX_NAME_LENGTH = 80;
export const MAX_DESCRIPTION_LENGTH = 500;

/** Trim and collapse any run of whitespace into a single space. */
export function normalizeName(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/** Comparison key for uniqueness: ignores case and spacing. */
export function nameKey(raw: string): string {
  return normalizeName(raw).toLowerCase();
}

export function validateName(raw: string): string {
  const name = normalizeName(raw);
  if (name.length < 1 || name.length > MAX_NAME_LENGTH) throw new RuleViolation("INVALID_NAME");
  return name;
}

/** Null/undefined/blank becomes null; otherwise trimmed text up to 500 chars. */
export function validateDescription(raw: string | null | undefined): string | null {
  const text = (raw ?? "").trim();
  if (text === "") return null;
  if (text.length > MAX_DESCRIPTION_LENGTH) throw new RuleViolation("INVALID_NAME");
  return text;
}
