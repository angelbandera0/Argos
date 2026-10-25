import { describe, expect, it } from "vitest";
import { RuleViolation } from "@/core/domain/errors";
import {
  formatUsername,
  isValidUsernameName,
  normalizeUsername,
  parseUsername,
} from "@/core/domain/username";

describe("username", () => {
  it("formats code and name", () => {
    expect(formatUsername("k7m2", "caja1")).toBe("k7m2.caja1");
  });

  it("parses a username", () => {
    expect(parseUsername("k7m2.caja1")).toEqual({ code: "k7m2", name: "caja1" });
  });

  it("throws RuleViolation when there is no dot", () => {
    expect.assertions(2);
    try {
      parseUsername("sinpunto");
    } catch (e) {
      expect(e).toBeInstanceOf(RuleViolation);
      expect((e as RuleViolation).code).toBe("INVALID_USERNAME");
    }
  });

  it("normalizes case and surrounding spaces", () => {
    expect(normalizeUsername("  K7M2.Caja1 ")).toBe("k7m2.caja1");
  });

  it.each(["caja1", "ana-lopez", "a_b"])("accepts %s", (name) => {
    expect(isValidUsernameName(name)).toBe(true);
  });

  it.each(["", "a", "ca ja", "ca.ja", "a".repeat(25), "Caja1"])(
    "rejects %j",
    (name) => {
      expect(isValidUsernameName(name)).toBe(false);
    },
  );
});
