import { describe, expect, it } from "vitest";
import { configErrorMessage, contentLabel, hasMinimum, minimumSchema, movementUnitSchema, presentationSchema } from "@/components/stock/product-config-logic";

describe("product-config-logic", () => {
  it("validates presentations and movement units", () => {
    expect(presentationSchema.safeParse({ name: " Saco ", content: "25,5" }).data).toEqual({ name: "Saco", content: 25.5 });
    expect(presentationSchema.safeParse({ name: "", content: "5" }).success).toBe(false);
    expect(presentationSchema.safeParse({ name: "x", content: "0" }).success).toBe(false);
    expect(movementUnitSchema.safeParse({ name: "x", equivalence: "abc" }).success).toBe(false);
    expect(movementUnitSchema.safeParse({ name: "Bolsa", equivalence: "5" }).success).toBe(true);
  });
  it("parses minimums, empty as 0", () => {
    expect(minimumSchema.parse({ minimum: "12,5" }).minimum).toBe(12.5);
    expect(minimumSchema.parse({ minimum: "" }).minimum).toBe(0);
    expect(minimumSchema.safeParse({ minimum: "-1" }).success).toBe(false);
  });
  it("treats 0 as no minimum", () => {
    expect(hasMinimum(0)).toBe(false);
    expect(hasMinimum(null)).toBe(false);
    expect(hasMinimum(3)).toBe(true);
  });
  it("labels", () => {
    expect(configErrorMessage("NAME_TAKEN")).toMatch(/nombre/);
    expect(configErrorMessage()).toMatch(/No se pudo/);
    expect(contentLabel(5, "l")).toBe("5 L");
  });
});

import { detailQuery, parseTab } from "@/components/stock/product-detail-logic";
describe("configuration tab param", () => {
  it("round-trips", () => {
    expect(parseTab("configuracion")).toBe("configuracion");
    expect(detailQuery({ pestana: "configuracion" })).toBe("?pestana=configuracion");
  });
});
