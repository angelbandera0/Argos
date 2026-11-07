import { describe, expect, it } from "vitest";
import { breakdownByStore, commandLine, draftFromBag, inRange, lineIssue, orderBadge, orderNumber, parseDateRange, parseOrderStatus, toWire } from "@/components/orders/order-logic";

const bag = [{ productId: "p1", productName: "Arroz", total: 10, stores: [{ storeId: "a", storeName: "A", qtyBase: 6 }, { storeId: "b", storeName: "B", qtyBase: 4 }] }];

describe("order-logic", () => {
  it("maps status to badges and parses filters", () => {
    expect(orderBadge("in_review")).toEqual({ family: "order", status: "review" });
    expect(parseOrderStatus("open")).toBe("open");
    expect(parseOrderStatus("x")).toBeUndefined();
    expect(orderNumber("abcdef123")).toBe("#ABCDEF");
  });
  it("normalizes date range", () => {
    expect(parseDateRange("2026-11-10", "2026-11-01")).toEqual({ from: "2026-11-01", to: "2026-11-10" });
    expect(parseDateRange("nope", "")).toEqual({ from: "", to: "" });
    expect(inRange("2026-11-05", { from: "2026-11-01", to: "" })).toBe(true);
    expect(inRange("2026-10-05", { from: "2026-11-01", to: "" })).toBe(false);
  });
  it("builds lines from the bag and validates the split", () => {
    const [l] = draftFromBag(bag, { p1: "lb" });
    expect(l).toMatchObject({ qty: 10, unit: "lb", mode: "stores" });
    expect(lineIssue(l)).toBeNull();
    expect(lineIssue({ ...l, qty: 11 })).toMatch(/reparto/);
    expect(lineIssue({ ...l, qty: 0 })).toMatch(/cantidad/);
    expect(lineIssue({ ...l, mode: "general", qty: 11 })).toBeNull();
  });
  it("derives the destination of the command line", () => {
    const [l] = draftFromBag(bag, {});
    expect(commandLine(toWire(l), "lb")).toMatchObject({ dest: "direct", plan: [{ storeId: "a", qty: 6 }, { storeId: "b", qty: 4 }] });
    expect(commandLine(toWire({ ...l, split: { a: 10 } }), "lb")).toMatchObject({ dest: "store", storeId: "a" });
    expect(commandLine(toWire({ ...l, mode: "general" }), "lb")).toEqual({ productId: "p1", qty: 10, unit: "lb", content: 1, dest: "direct" });
  });
  it("breaks the order down by store", () => {
    const [l] = draftFromBag(bag, {});
    expect(breakdownByStore([l, { ...l, key: "k", mode: "general" }])).toEqual({ general: 1, stores: { a: 6, b: 4 } });
  });
});
