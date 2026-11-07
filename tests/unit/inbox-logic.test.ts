import { describe, expect, it } from "vitest";
import { attendSchema, groupBag, maxTransfer, parseInboxStatus } from "@/components/requests/inbox-logic";

describe("inbox-logic", () => {
  it("parses status", () => {
    expect(parseInboxStatus("to_buy")).toBe("to_buy");
    expect(parseInboxStatus("x")).toBeUndefined();
  });
  it("caps transfer", () => {
    expect(maxTransfer(10, 4)).toBe(4);
    expect(maxTransfer(3, 4)).toBe(3);
    expect(maxTransfer(3, -1)).toBe(0);
  });
  it("validates decisions with comma amounts", () => {
    expect(attendSchema.safeParse({ lineId: "l", kind: "fulfilled", qty: "1,5", reason: "" }).data?.qty).toBe(1.5);
    expect(attendSchema.safeParse({ lineId: "l", kind: "bad", qty: "1", reason: "" }).success).toBe(false);
    expect(attendSchema.safeParse({ lineId: "l", kind: "pending", qty: "0", reason: "" }).success).toBe(false);
  });
  it("groups the bag by product", () => {
    const g = groupBag([
      { productId: "p", productName: "Arroz", storeId: "a", storeName: "A", qtyBase: 2 },
      { productId: "p", productName: "Arroz", storeId: "b", storeName: "B", qtyBase: 1.5 },
    ]);
    expect(g).toHaveLength(1);
    expect(g[0].total).toBe(3.5);
  });
});
