import { describe, expect, it } from "vitest";
import { blankProduct, descriptionCounter, nameMessage, productChecklist, wantsAnother } from "@/components/catalog/product-form-logic";

describe("product form logic", () => {
  it("counts the description and warns from 450", () => {
    expect(descriptionCounter(38)).toEqual({ text: "38 / 500", warn: false });
    expect(descriptionCounter(449).warn).toBe(false);
    expect(descriptionCounter(450).warn).toBe(true);
  });
  it("completes the checklist only with unique name and category", () => {
    expect(productChecklist({ nameStatus: "ok", hasCategory: true }).complete).toBe(true);
    expect(productChecklist({ nameStatus: "checking", hasCategory: true }).complete).toBe(false);
    expect(productChecklist({ nameStatus: "taken", hasCategory: true }).items[0].state).toBe("todo");
    expect(productChecklist({ nameStatus: "ok", hasCategory: false }).complete).toBe(false);
  });
  it("explains name problems", () => {
    expect(nameMessage("taken", false)).toBe("Ya existe un producto con ese nombre.");
    expect(nameMessage("empty", true)).toMatch(/Escribe/);
    expect(nameMessage("empty", false)).toBeUndefined();
  });
  it("save-and-create-another resets to an empty active form", () => {
    expect(wantsAnother("1")).toBe(true);
    expect(wantsAnother(null)).toBe(false);
    expect(blankProduct()).toEqual({ name: "", categoryId: "", description: "", active: true });
  });
});

import { nameStatusOf } from "@/components/catalog/product-form-logic";

describe("nameStatusOf", () => {
  it("resolves the uniqueness status", () => {
    expect(nameStatusOf("", null, null)).toBe("empty");
    expect(nameStatusOf("Ñame", null, null)).toBe("checking");
    expect(nameStatusOf("Ñame", null, { name: "Ñame", available: false })).toBe("taken");
    expect(nameStatusOf("Ñame", null, { name: "Ñame", available: true })).toBe("ok");
    expect(nameStatusOf("Ñame", "Ñame", null)).toBe("ok");
  });
});
