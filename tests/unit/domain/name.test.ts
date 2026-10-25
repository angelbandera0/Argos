import { describe, expect, it } from "vitest";
import { RuleViolation } from "@/core/domain/errors";
import { nameKey, normalizeName, validateDescription, validateName } from "@/core/domain/name";

const invalid = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(RuleViolation);
    expect((e as RuleViolation).code).toBe("INVALID_NAME");
    return;
  }
  throw new Error("did not throw");
};

describe("name", () => {
  it("normalizeName trims and collapses whitespace", () => {
    expect(normalizeName("  Pan   de \t sal ")).toBe("Pan de sal");
  });

  it("nameKey ignores case and spacing", () => {
    expect(nameKey(" PAN  De Sal")).toBe("pan de sal");
    expect(nameKey("Pan")).toBe(nameKey(" pan "));
  });

  it("validateName returns the normalized name within 1..80 chars", () => {
    expect(validateName("  Pan  dulce ")).toBe("Pan dulce");
    expect(validateName("a".repeat(80))).toBe("a".repeat(80));
  });

  it("validateName rejects empty, blank and over-80 names", () => {
    invalid(() => validateName(""));
    invalid(() => validateName("   "));
    invalid(() => validateName("a".repeat(81)));
  });

  it("validateDescription maps null, undefined and blank to null, trims text", () => {
    expect(validateDescription(undefined)).toBeNull();
    expect(validateDescription(null)).toBeNull();
    expect(validateDescription("   ")).toBeNull();
    expect(validateDescription("  fresco ")).toBe("fresco");
    expect(validateDescription("a".repeat(500))).toBe("a".repeat(500));
  });

  it("validateDescription rejects more than 500 chars", () => {
    invalid(() => validateDescription("a".repeat(501)));
  });
});
