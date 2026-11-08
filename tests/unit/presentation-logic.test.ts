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
