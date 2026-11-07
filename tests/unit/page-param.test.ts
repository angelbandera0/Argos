import { describe, expect, it } from "vitest";
import { parsePage } from "@/components/ui/page-param";

describe("parsePage", () => {
  it("falls back to 1", () => {
    for (const v of [undefined, "", "0", "-2", "1.5", "x", ["2"]]) expect(parsePage(v)).toBe(1);
  });
  it("parses valid pages", () => expect(parsePage("3")).toBe(3));
});
