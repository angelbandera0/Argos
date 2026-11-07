import { Forbidden, NotFound, RuleViolation, translateStockError } from "@/core/domain/errors";

export type PgError = { code?: string; message?: string };

export function stockError(op: string, error: PgError): never {
  const translated = translateStockError(error.message ?? "");
  if (translated instanceof RuleViolation || translated instanceof Forbidden) throw translated;
  if (error.code === "23505") throw new RuleViolation("NAME_TAKEN");
  if (error.code === "23503") throw new NotFound();
  if (error.code === "42501") throw new Forbidden();
  throw new Error(`${op} failed (${error.code ?? "unknown"}: ${error.message ?? ""})`);
}
