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

  describe("parseUsername strictness", () => {
    const code = (fn: () => unknown) => {
      try {
        fn();
      } catch (e) {
        return e instanceof RuleViolation ? e.code : "other";
      }
      return "none";
    };

    it.each(["k7m2.ca.ja", ".x", "k7m2.", "k7m.caja1", "k7m22.caja1", "k7m2.a", "k7m2.ca ja"])(
      "rejects %j",
      (raw) => {
        expect(code(() => parseUsername(raw))).toBe("INVALID_USERNAME");
      },
    );

    it("normalizes uppercase and whitespace", () => {
      expect(parseUsername(" K7M2.Caja1 ")).toEqual({ code: "k7m2", name: "caja1" });
    });
  });

  describe("formatUsername strictness", () => {
    it("normalizes uppercase", () => {
      expect(formatUsername("K7M2", "Caja1")).toBe("k7m2.caja1");
    });

    it.each([
      ["k7m2", "Caja 1"],
      ["k7m", "caja1"],
      ["k7m22", "caja1"],
      ["k7m2", "a"],
      ["k7m2", "ca.ja"],
    ])("throws for %j, %j", (c, n) => {
      expect(() => formatUsername(c, n)).toThrow(RuleViolation);
    });
  });

  describe("isValidUsernameName boundaries", () => {
    it("accepts 2 and 24 chars", () => {
      expect(isValidUsernameName("ab")).toBe(true);
      expect(isValidUsernameName("a".repeat(24))).toBe(true);
    });
    it("rejects 1 and 25 chars", () => {
      expect(isValidUsernameName("a")).toBe(false);
      expect(isValidUsernameName("a".repeat(25))).toBe(false);
    });
  });
});
