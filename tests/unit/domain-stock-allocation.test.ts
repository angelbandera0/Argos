import { describe, expect, it } from "vitest";
import { allocateChosen, applyAllocations, crossedThreshold, isFifoDeviation, qty, stockStatus, suggestFifo, type Lot } from "@/core/domain/stock";

const code = (fn: () => unknown) => {
  try {
    fn();
  } catch (e) {
    return (e as { code?: string }).code;
  }
};

const lots: Lot[] = [
  { id: "b", createdAt: "2026-02-01", remaining: qty(50) },
  { id: "a", createdAt: new Date("2026-01-01"), remaining: qty(30) },
  { id: "z", createdAt: "2026-01-15", remaining: qty(0) },
];

describe("FIFO", () => {
  it("CA-03: uses oldest lot, ignores empty, splits across lots", () => {
    expect(suggestFifo(lots, qty(10))).toEqual([{ lotId: "a", qty: qty(10) }]);
    expect(suggestFifo(lots, qty(40))).toEqual([
      { lotId: "a", qty: qty(30) },
      { lotId: "b", qty: qty(10) },
    ]);
    expect(suggestFifo(lots, qty(0))).toEqual([]);
  });
  it("ties broken by id", () => {
    const t: Lot[] = [
      { id: "y", createdAt: "2026-01-01", remaining: qty(5) },
      { id: "x", createdAt: "2026-01-01", remaining: qty(5) },
    ];
    expect(suggestFifo(t, qty(5))[0].lotId).toBe("x");
  });
  it("INSUFFICIENT_STOCK when needed > total", () => {
    expect(code(() => suggestFifo(lots, qty(80.001)))).toBe("INSUFFICIENT_STOCK");
    expect(suggestFifo(lots, qty(80))).toHaveLength(2);
    expect(code(() => allocateChosen(lots, [{ lotId: "a", qty: qty(30) }], qty(81)))).toBe("INSUFFICIENT_STOCK");
  });
  it("CA-03: choosing another lot is a deviation", () => {
    const sug = suggestFifo(lots, qty(10));
    expect(isFifoDeviation(lots, sug, qty(10))).toBe(false);
    const other = allocateChosen(lots, [{ lotId: "b", qty: qty(10) }], qty(10));
    expect(isFifoDeviation(lots, other, qty(10))).toBe(true);
    const split = allocateChosen(lots, [{ lotId: "a", qty: qty(4) }, { lotId: "b", qty: qty(6) }], qty(10));
    expect(isFifoDeviation(lots, split, qty(10))).toBe(true);
    const same = allocateChosen(lots, [{ lotId: "b", qty: qty(10) }, { lotId: "a", qty: qty(30) }], qty(40));
    expect(isFifoDeviation(lots, same, qty(40))).toBe(false);
  });
  it("CA-04: cannot exceed lot or total; validations", () => {
    expect(code(() => allocateChosen(lots, [{ lotId: "a", qty: qty(31) }], qty(31)))).toBe("LOT_EXCEEDED");
    expect(code(() => allocateChosen(lots, [{ lotId: "q", qty: qty(1) }], qty(1)))).toBe("LOT_NOT_FOUND");
    expect(code(() => allocateChosen(lots, [{ lotId: "a", qty: qty(5) }], qty(6)))).toBe("QUANTITY_MISMATCH");
    expect(code(() => allocateChosen(lots, [{ lotId: "a", qty: qty(0) }], qty(0)))).toBe("INVALID_INPUT");
    expect(code(() => allocateChosen(lots, [{ lotId: "a", qty: qty(1) }, { lotId: "a", qty: qty(1) }], qty(2)))).toBe("INVALID_INPUT");
  });
  it("applyAllocations is immutable and never negative", () => {
    const out = applyAllocations(lots, [{ lotId: "a", qty: qty(30) }, { lotId: "b", qty: qty(10) }]);
    expect(out.map((l) => l.remaining)).toEqual([qty(40), qty(0), qty(0)]);
    expect(lots[0].remaining).toBe(qty(50));
    expect(code(() => applyAllocations(lots, [{ lotId: "a", qty: qty(31) }]))).toBe("LOT_EXCEEDED");
    expect(code(() => applyAllocations(lots, [{ lotId: "q", qty: qty(1) }]))).toBe("LOT_NOT_FOUND");
  });
});

describe("status", () => {
  it("normal / low / out", () => {
    expect(stockStatus(qty(0), qty(5))).toBe("out");
    expect(stockStatus(qty(0), null)).toBe("out");
    expect(stockStatus(qty(5), qty(5))).toBe("low");
    expect(stockStatus(qty(0.001), qty(5))).toBe("low");
    expect(stockStatus(qty(5.001), qty(5))).toBe("normal");
    expect(stockStatus(qty(1), null)).toBe("normal");
  });
  it("crossedThreshold notifies only on worsening", () => {
    expect(crossedThreshold(qty(10), qty(5), qty(5))).toBe("low");
    expect(crossedThreshold(qty(5), qty(2), qty(5))).toBeNull();
    expect(crossedThreshold(qty(5), qty(0), qty(5))).toBe("out");
    expect(crossedThreshold(qty(10), qty(0), qty(5))).toBe("out");
    expect(crossedThreshold(qty(2), qty(10), qty(5))).toBeNull();
    expect(crossedThreshold(qty(10), qty(8), qty(5))).toBeNull();
    expect(crossedThreshold(qty(3), qty(0), null)).toBe("out");
  });
});
