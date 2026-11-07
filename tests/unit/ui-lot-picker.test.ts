import { describe, expect, it } from "vitest";
import { allocated, isBalanced, isSuggested, setLotQty, suggestedAllocation, type Lot } from "@/components/ui/lot-logic";

const lots: Lot[] = [
  { id: "a", code: "L-1", meta: "", remaining: 25 },
  { id: "b", code: "L-2", meta: "", remaining: 40 },
];

describe("lot-logic", () => {
  it("suggests oldest first", () => {
    expect(suggestedAllocation(lots, 30)).toEqual({ a: 25, b: 5 });
    expect(suggestedAllocation(lots, 10)).toEqual({ a: 10, b: 0 });
  });
  it("clamps to lot remaining and to what is left", () => {
    const s = suggestedAllocation(lots, 30);
    expect(setLotQty(s, lots, 30, "a", 99).a).toBe(25);
    expect(setLotQty({ a: 0, b: 28 }, lots, 30, "a", 10).a).toBe(2);
    expect(setLotQty(s, lots, 30, "b", -3).b).toBe(0);
  });
  it("checks balance and deviation", () => {
    expect(allocated({ a: 10.1, b: 0.2 })).toBe(10.3);
    expect(isBalanced({ a: 25, b: 5 }, 30)).toBe(true);
    expect(isBalanced({ a: 20, b: 5 }, 30)).toBe(false);
    expect(isSuggested({ a: 25, b: 5 }, lots, 30)).toBe(true);
    expect(isSuggested({ a: 20, b: 10 }, lots, 30)).toBe(false);
  });
});
