import { describe, expect, it } from "vitest";
import type { OrderLine } from "@/core/application/ports/order-repository";
import { adjustValid, draftFromReview, missing, needsSplit, reviewIssue, reviewReady, reviewSchema, shortageOf, surplus, timelineSteps, toReviewLines } from "@/components/orders/review-logic";

const line = (p: Partial<OrderLine> = {}): OrderLine => ({ id: "l1", productId: "p", productName: "Frijol", dest: "direct", destStoreId: null, qty: 10, unit: "kg", content: 1, qtyBought: 8, qtyReceived: null, plan: [], ...p });

describe("review-logic", () => {
  it("starts from received or bought", () => {
    expect(draftFromReview(line()).received).toBe("8");
    expect(draftFromReview(line({ qtyReceived: 5 })).received).toBe("5");
  });
  it("requires split for general direct lines with received > 0", () => {
    const l = line();
    expect(needsSplit(l)).toBe(true);
    expect(reviewIssue(l, { lineId: "l1", received: "8", split: { a: 3 } })).toMatch(/Reparte/);
    expect(reviewIssue(l, { lineId: "l1", received: "8", split: { a: 3, b: 5 } })).toBeNull();
    expect(reviewIssue(l, { lineId: "l1", received: "0", split: {} })).toBeNull();
    expect(reviewReady([l], [{ lineId: "l1", received: "8", split: {} }])).toBe(false);
  });
  it("store lines need no split", () => {
    expect(reviewIssue(line({ dest: "store" }), { lineId: "l1", received: "8", split: {} })).toBeNull();
  });
  it("shortage and surplus", () => {
    expect(missing(8, 5)).toBe(3);
    expect(surplus(8, 10)).toBe(2);
    expect(shortageOf(8, 5, 2.5)).toBe(7.5);
    expect(shortageOf(8, 5, null)).toBeNull();
    expect(shortageOf(8, 5, undefined)).toBeNull();
  });
  it("builds review lines with reparto only when needed", () => {
    expect(toReviewLines([line()], [{ lineId: "l1", received: "8", split: { a: 3, b: 5, c: 0 } }])).toEqual([
      { lineId: "l1", qtyReceived: 8, reparto: [{ storeId: "a", qty: 3 }, { storeId: "b", qty: 5 }] },
    ]);
    expect(toReviewLines([line({ dest: "store" })], [{ lineId: "l1", received: "8", split: {} }])).toEqual([{ lineId: "l1", qtyReceived: 8 }]);
  });
  it("validates action payloads", () => {
    expect(reviewSchema.safeParse({ kind: "return", orderId: "o", note: "ab" }).success).toBe(false);
    expect(reviewSchema.safeParse({ kind: "return", orderId: "o", note: "falta frijol" }).success).toBe(true);
  });
  it("timeline reflects status", () => {
    const ev = (kind: "created" | "submitted" | "confirmed" | "adjusted", note: string | null = null) => ({ kind, actor: null, at: "2026-11-07T10:00:00Z", note });
    expect(timelineSteps([ev("created"), ev("submitted")], "in_review").map((s) => s.state)).toEqual(["done", "done", "now"]);
    expect(timelineSteps([ev("created"), ev("confirmed"), ev("adjusted", "x")], "fulfilled").at(-1)).toMatchObject({ title: "Ajuste", note: "x", meta: "2026-11-07" });
  });
  it("adjust never leaves a lot negative", () => {
    const lot = { lotId: "x", label: "L", remaining: 5 };
    expect(adjustValid(lot, -6, "motivo")).toBe(false);
    expect(adjustValid(lot, -2, "motivo")).toBe(true);
    expect(adjustValid(lot, 0, "motivo")).toBe(false);
  });
});
