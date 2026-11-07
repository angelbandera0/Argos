import {
  AuthFailed,
  Forbidden,
  NotFound,
  RuleViolation,
  SessionExpired,
} from "@/core/domain/errors";

const FORBIDDEN_CODES = ["COST_NOT_ALLOWED", "CHOOSE_LOT_FORBIDDEN", "STANDARD_REASON_LOCKED"];
const CONFLICT_CODES = ["NAME_TAKEN", "CODE_TAKEN", "BASE_UNIT_IN_USE", "DUPLICATE_LOT"];

export function problem(status: number, title: string, code?: string): Response {
  return new Response(JSON.stringify({ type: "about:blank", title, status, ...(code && { code }) }), {
    status,
    headers: { "content-type": "application/problem+json" },
  });
}

export function toProblem(error: unknown): Response {
  if (error instanceof Forbidden) return problem(403, "Forbidden");
  if (error instanceof NotFound) return problem(404, "Not found");
  if (error instanceof RuleViolation && FORBIDDEN_CODES.includes(error.code)) return problem(403, "Forbidden", error.code);
  if (error instanceof RuleViolation && CONFLICT_CODES.includes(error.code)) return problem(409, "Conflict", error.code);
  if (error instanceof RuleViolation) return problem(422, "Rule violation", error.code);
  if (error instanceof AuthFailed || error instanceof SessionExpired) {
    return problem(401, "Unauthorized");
  }
  return problem(500, "Internal server error");
}
