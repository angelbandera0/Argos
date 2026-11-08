import { describe, expect, it } from "vitest";
import { allocateChosenPacks, availablePacks, isPackDeviation, qty, suggestPacksFifo, totalQty, toNumber, type PackLot } from "@/core/domain/stock";
import { packBreakdown, packShortageMessage } from "@/components/stock/transfer-logic";

const lot = (id: string, day: number, remaining: number, content: number | null): PackLot => ({
  id,
  createdAt: `2026-01-0${day}`,
  remaining: qty(remaining),
  presentation: content === null ? null : { name: "Saco", content: qty(content) },
});
const lots = [lot("b", 2, 100, 25), lot("a", 1, 85, 40), lot("g", 3, 50, null)];

describe("packs per lot content", () => {
  it("takes whole packs oldest first, each with its own content", () => {
    const r = suggestPacksFifo(lots, "saco", 4);
    expect(r.map((x) => [x.lotId, x.packs, toNumber(x.qty)])).toEqual([["a", 2, 80], ["b", 2, 50]]);
    expect(toNumber(totalQty(r))).toBe(130);
  });
  it("skips loose remainders and bulk lots", () => {
    expect(availablePacks(lots, "Saco")).toBe(6);
    expect(() => suggestPacksFifo(lots, "saco", 7)).toThrow("INSUFFICIENT_PACKS");
  });
  it("rejects fractional packs", () => {
    expect(() => suggestPacksFifo(lots, "saco", 1.5)).toThrow("INVALID_QUANTITY");
  });
  it("converts chosen packs per lot and validates them", () => {
    const r = allocateChosenPacks(lots, "saco", [{ lotId: "b", packs: 3 }, { lotId: "a", packs: 1 }], 4);
    expect(toNumber(totalQty(r))).toBe(115);
    expect(isPackDeviation(lots, "saco", r, 4)).toBe(true);
    expect(() => allocateChosenPacks(lots, "saco", [{ lotId: "a", packs: 3 }], 3)).toThrow("LOT_EXCEEDED");
    expect(() => allocateChosenPacks(lots, "saco", [{ lotId: "g", packs: 1 }], 1)).toThrow("LOT_NOT_FOUND");
    expect(() => allocateChosenPacks(lots, "saco", [{ lotId: "a", packs: 1 }], 2)).toThrow("QUANTITY_MISMATCH");
  });
  it("describes the split and the shortage", () => {
    const pl = [{ id: "aaaaaaaa1", receivedAt: "", remaining: 85, presentation: { name: "Saco", content: 40 } }, { id: "bbbbbbbb2", receivedAt: "", remaining: 100, presentation: { name: "Saco", content: 25 } }];
    expect(packBreakdown(pl, [{ lotId: "aaaaaaaa1", qty: 3 }, { lotId: "bbbbbbbb2", qty: 2 }], "Saco", "lb")).toBe("3 sacos del lote aaaaaaaa (40 lb) + 2 del lote bbbbbbbb (25 lb) = 170 lb");
    expect(packShortageMessage("Saco", 3)).toBe("Solo hay 3 sacos completos.");
  });
});
