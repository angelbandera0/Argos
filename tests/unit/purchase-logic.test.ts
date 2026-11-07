import { describe, expect, it } from "vitest";
import { draftIssue, draftsComparison, purchaseReady, toPurchaseLines, type PurchaseDraft } from "@/components/orders/purchase-logic";

const d = (o: Partial<PurchaseDraft>): PurchaseDraft => ({ lineId: "l", bought: true, qty: "9", cost: "50", ...o });

describe("purchase logic", () => {
  it("requires a mark, and quantity and cost when bought", () => {
    expect(draftIssue(d({ bought: null }))).toMatch(/Marca/);
    expect(draftIssue(d({ qty: "" }))).toMatch(/cantidad/);
    expect(draftIssue(d({ cost: "" }))).toMatch(/costo/);
    expect(draftIssue(d({ bought: false, qty: "", cost: "" }))).toBeNull();
  });
  it("is ready only when every line is complete", () => {
    expect(purchaseReady([d({}), d({ bought: false })])).toBe(true);
    expect(purchaseReady([d({}), d({ bought: null })])).toBe(false);
    expect(purchaseReady([])).toBe(false);
  });
  it("computes delivered, spent and leftover (CA-03b)", () => {
    expect(draftsComparison(500, [d({ qty: "9", cost: "50" }), d({ qty: "2", cost: "10" }), d({ bought: false })])).toEqual({ given: 500, spent: 470, leftover: 30 });
    expect(draftsComparison(null, [d({})]).leftover).toBeNull();
  });
  it("sends zeros for lines not bought", () => {
    expect(toPurchaseLines([d({ bought: false })])).toEqual([{ lineId: "l", qtyBought: 0, unitCost: 0 }]);
  });
});
