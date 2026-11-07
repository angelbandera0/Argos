import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { stockError, type PgError } from "./stock-errors";

/** Translates a database error with the given domain translator; unknown codes fall back to the stock mapping. */
export function replenishmentError(op: string, error: PgError, translate: (code: string) => Error): never {
  const t = translate(error.message ?? "");
  if (t instanceof RuleViolation || t instanceof Forbidden || t instanceof NotFound) throw t;
  return stockError(op, error);
}
