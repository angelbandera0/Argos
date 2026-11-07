import { describe, expect, it } from "vitest";
import { toProblem } from "@/app/api/v1/_lib/problem";
import { AuthFailed, Forbidden, NotFound, RuleViolation, SessionExpired } from "@/core/domain/errors";

describe("toProblem", () => {
  it.each([
    [new Forbidden(), 403, undefined],
    [new NotFound(), 404, undefined],
    [new RuleViolation("HAS_DATA"), 422, "HAS_DATA"],
    [new RuleViolation("COST_NOT_ALLOWED"), 403, "COST_NOT_ALLOWED"],
    [new RuleViolation("STANDARD_REASON_LOCKED"), 403, "STANDARD_REASON_LOCKED"],
    [new RuleViolation("NAME_TAKEN"), 409, "NAME_TAKEN"],
    [new RuleViolation("BASE_UNIT_IN_USE"), 409, "BASE_UNIT_IN_USE"],
    [new RuleViolation("INSUFFICIENT_STOCK"), 422, "INSUFFICIENT_STOCK"],
    [new AuthFailed(), 401, undefined],
    [new SessionExpired(), 401, undefined],
    [new Error("boom secret"), 500, undefined],
  ])("%s", async (err, status, code) => {
    const res = toProblem(err);
    expect(res.status).toBe(status);
    expect(res.headers.get("content-type")).toBe("application/problem+json");
    const body = await res.json();
    expect(body.code).toBe(code);
    expect(JSON.stringify(body)).not.toMatch(/stack|boom|secret| at /);
  });
});
