import { describe, expect, it } from "vitest";
import { qty, stockByPresentation } from "@/core/domain/stock";

const saco = { name: "saco", content: qty(40) };

describe("stockByPresentation", () => {
  it("20 sacks of 40 lb: 20 complete, no loose", () => {
    const r = stockByPresentation([{ remaining: qty(800), presentation: saco }]);
    expect(r.presentations[0]).toMatchObject({ name: "saco", complete: 20, loose: qty(0), total: qty(800) });
    expect(r.total).toBe(qty(800));
  });
  it("770 lb: 19 complete + 10 loose", () => {
    const r = stockByPresentation([{ remaining: qty(770), presentation: saco }]);
    expect(r.presentations[0]).toMatchObject({ complete: 19, loose: qty(10) });
  });
  it("box of 20 lb after 10 portions: 0 complete + 10 loose", () => {
    const r = stockByPresentation([{ remaining: qty(10), presentation: { name: "caja", content: qty(20) } }]);
    expect(r.presentations[0]).toMatchObject({ complete: 0, loose: qty(10) });
  });
  it("two opened sacks stay loose, groups by name and content, bulk apart, empty lots ignored", () => {
    const r = stockByPresentation([
      { remaining: qty(30), presentation: saco },
      { remaining: qty(30), presentation: saco },
      { remaining: qty(25), presentation: { name: "saco", content: qty(25) } },
      { remaining: qty(7.5), presentation: null },
      { remaining: qty(0), presentation: saco },
    ]);
    expect(r.presentations).toHaveLength(2);
    expect(r.presentations[0]).toMatchObject({ complete: 0, loose: qty(60) });
    expect(r.presentations[1]).toMatchObject({ complete: 1, loose: qty(0) });
    expect(r.bulk).toBe(qty(7.5));
    expect(r.total).toBe(qty(92.5));
  });
});
