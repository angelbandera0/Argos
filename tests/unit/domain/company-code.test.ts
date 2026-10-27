import { describe, expect, it } from "vitest";
import { generateCompanyCode } from "@/core/domain/company-code";

describe("generateCompanyCode", () => {
  it("maps index 0 to a", () => {
    expect(generateCompanyCode(() => 0)).toBe("aaaa");
  });

  it("maps index 35 to 9", () => {
    expect(generateCompanyCode((max) => max - 1)).toBe("9999");
  });

  it("asks for an index below 36", () => {
    const maxes: number[] = [];
    generateCompanyCode((max) => {
      maxes.push(max);
      return 0;
    });
    expect(maxes).toEqual([36, 36, 36, 36]);
  });

  it("always yields 4 chars of [a-z0-9]", () => {
    for (let i = 0; i < 100; i++) {
      const code = generateCompanyCode((max) => Math.floor(Math.random() * max));
      expect(code).toMatch(/^[a-z0-9]{4}$/);
    }
  });
});
