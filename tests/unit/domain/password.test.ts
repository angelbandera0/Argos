import { describe, expect, it } from "vitest";
import { RuleViolation } from "@/core/domain/errors";
import { validateAdminPassword } from "@/core/domain/password";

describe("validateAdminPassword", () => {
  it("rejects 11 characters", () => {
    expect.assertions(2);
    try {
      validateAdminPassword("a".repeat(11));
    } catch (e) {
      expect(e).toBeInstanceOf(RuleViolation);
      expect((e as RuleViolation).code).toBe("PASSWORD_TOO_SHORT");
    }
  });

  it("accepts 12 characters", () => {
    expect(() => validateAdminPassword("a".repeat(12))).not.toThrow();
  });

  it("has no composition rules (12 spaces pass)", () => {
    expect(() => validateAdminPassword(" ".repeat(12))).not.toThrow();
  });
});
