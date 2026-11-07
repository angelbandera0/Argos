import { describe, expect, it } from "vitest";
import { lineBadge, parseLines, requestBadge, requestSchema, requestErrorMessage, suggestedAmount } from "@/components/requests/request-logic";

describe("request logic", () => {
  it("suggests the amount missing to the minimum", () => {
    expect(suggestedAmount(2, 10)).toBe("8");
    expect(suggestedAmount(2.5, 10)).toBe("7,5");
    expect(suggestedAmount(10, 10)).toBe("");
    expect(suggestedAmount(0, null)).toBe("");
  });

  it("validates lines and accepts decimal commas", () => {
    const ok = requestSchema.safeParse({ note: "", lines: parseLines('[{"productId":"p","qty":"1,5","unit":"base"}]') });
    expect(ok.success && ok.data.lines[0].qty).toBe(1.5);
    expect(requestSchema.safeParse({ note: "", lines: [] }).success).toBe(false);
    expect(requestSchema.safeParse({ note: "", lines: parseLines('[{"productId":"p","qty":"0","unit":"base"}]') }).success).toBe(false);
    expect(parseLines("nope")).toEqual([]);
  });

  it("maps statuses to badges", () => {
    expect(requestBadge("new")).toEqual({ family: "request", status: "unattended" });
    expect(requestBadge("to_buy")).toEqual({ family: "line", status: "toBuy" });
    expect(lineBadge("in_progress")).toEqual({ family: "line", status: "partial" });
    expect(lineBadge("new")).toEqual({ family: "line", status: "pending" });
  });

  it("falls back to a generic error", () => {
    expect(requestErrorMessage("DUPLICATE_PRODUCT")).toMatch(/dos veces/);
    expect(requestErrorMessage("X")).toMatch(/No se pudo/);
  });
});
