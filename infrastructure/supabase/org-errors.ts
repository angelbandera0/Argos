import "server-only";
import { Forbidden, RuleViolation } from "@/core/domain/errors";

type PgError = { code?: string; message?: string };

export function orgError(op: string, error: PgError): never {
  const m = error.message ?? "";
  if (m.includes("HAS_DATA")) throw new RuleViolation("HAS_DATA");
  if (m.includes("founder cannot be")) throw new RuleViolation("FOUNDER_PROTECTED");
  if (m.includes("reason")) throw new RuleViolation("REASON_REQUIRED");
  if (m.includes("session_cap_seconds")) throw new RuleViolation("SESSION_TOO_LONG");
  if (error.code === "23505") throw new RuleViolation("NAME_TAKEN");
  if (error.code === "42501") throw new Forbidden();
  throw new Error(`${op} failed (${error.code ?? "unknown"})`);
}
