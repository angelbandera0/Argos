import { RuleViolation } from "./errors";

const NAME_PATTERN = /^[a-z0-9_-]{2,24}$/;

export function formatUsername(code: string, name: string): string {
  return `${code}.${name}`;
}

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidUsernameName(name: string): boolean {
  return NAME_PATTERN.test(name);
}

export function parseUsername(username: string): { code: string; name: string } {
  const dot = username.indexOf(".");
  if (dot === -1) throw new RuleViolation("INVALID_USERNAME");
  return { code: username.slice(0, dot), name: username.slice(dot + 1) };
}
