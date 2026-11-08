import { describe, expect, it } from "vitest";
import { lotPresentation, pluralName, presentationStock } from "@/components/stock/presentation-logic";

const saco = { name: "Saco", content: 40 };

describe("presentation labels", () => {
  it("plural", () => {
    expect([pluralName("Saco", 20), pluralName("saco", 1), pluralName("Pan", 3)]).toEqual(["sacos", "saco", "panes"]);
  });
  it("20 sacks", () => {
    expect(presentationStock([{ remaining: 800, presentation: saco }], "lb")).toEqual({ main: "20 sacos", base: "800,000 lb" });
  });
  it("loose pounds", () => {
    expect(presentationStock([{ remaining: 770, presentation: saco }], "lb")?.main).toBe("19 sacos completos + 10,000 lb sueltas");
  });
  it("box after 10 portions", () => {
    expect(presentationStock([{ remaining: 10, presentation: { name: "Caja", content: 20 } }], "lb")?.main).toBe("0 cajas completas + 10,000 lb sueltas");
  });
  it("bulk has no presentation", () => {
    expect(presentationStock([{ remaining: 5, presentation: null }], "lb")).toBeNull();
    expect(lotPresentation({ initialQty: 5, remaining: 5, presentation: null }, "lb")).toBeNull();
  });
  it("lot", () => {
    expect(lotPresentation({ initialQty: 800, remaining: 770, presentation: saco }, "lb")).toEqual({ entered: "20 sacos de 40 lb", remaining: "19 sacos completos + 10,000 lb sueltas" });
  });
});

import { movementAsked } from "@/components/stock/presentation-logic";
import { moveEquivalent, moveUnitOptions } from "@/components/stock/transfer-logic";

describe("movement units", () => {
  const base = { qtyDelta: -200, capturedQty: 200, capturedUnit: "lb" };
  it("asked label", () => {
    expect(movementAsked({ ...base, askedQty: 5, askedUnit: "Saco" }, "lb")).toBe("5 sacos (200,000 lb)");
    expect(movementAsked({ ...base, askedQty: 10, askedUnit: "kg" }, "lb")).toBe("10 kg (200,000 lb)");
    expect(movementAsked({ ...base, askedQty: null, askedUnit: null }, "lb")).toBeNull();
  });
  it("options and equivalent", () => {
    const o = moveUnitOptions({ baseUnit: "lb", presentations: [{ name: "Saco", content: 40 }], units: [{ name: "Ración", equivalence: 1 }] });
    expect(o.map((x) => x.value)).toEqual(["base", "Saco", "Ración", "kg", "g", "oz"]);
    expect(moveEquivalent(o, "Saco", "5", "lb")).toBe("= 200 lb");
    expect(moveEquivalent(o, "base", "5", "lb")).toBeUndefined();
  });
});
