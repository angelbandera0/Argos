import { RuleViolation } from "./errors";

const NAME_PATTERN = /^[a-z0-9_-]{2,24}$/;
const CODE_PATTERN = /^[a-z0-9]{4}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidUsernameName(name: string): boolean {
  return NAME_PATTERN.test(name);
}

export function formatUsername(code: string, name: string): string {
  const c = normalizeUsername(code);
  const n = normalizeUsername(name);
  if (!CODE_PATTERN.test(c) || !isValidUsernameName(n)) {
    throw new RuleViolation("INVALID_USERNAME");
  }
  return `${c}.${n}`;
}

export function parseUsername(raw: string): { code: string; name: string } {
  const parts = normalizeUsername(raw).split(".");
  if (parts.length !== 2) throw new RuleViolation("INVALID_USERNAME");
  const [code, name] = parts;
  if (!CODE_PATTERN.test(code) || !isValidUsernameName(name)) {
    throw new RuleViolation("INVALID_USERNAME");
  }
  return { code, name };
}
