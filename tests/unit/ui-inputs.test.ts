import { describe, expect, it } from "vitest";
import { buttonClass } from "@/components/ui/button-class";
import { pickOptions, splitTags } from "@/components/ui/multiselect-utils";

describe("buttonClass", () => {
  it("omite la clase de tamaño mediano y añade la propia", () => {
    expect(buttonClass("primary", "md")).toBe("btn btn-primary");
    expect(buttonClass("danger", "sm", "x")).toBe("btn btn-danger btn-sm x");
  });
});

describe("multiselect", () => {
  const options = [
    { value: "a", label: "A" },
    { value: "b", label: "B" },
  ];
  it("recupera las opciones elegidas ignorando valores desconocidos", () => {
    expect(pickOptions(options, ["b", "z"])).toEqual([options[1]]);
  });
  it("separa etiquetas visibles y ocultas", () => {
    expect(splitTags([1, 2, 3, 4, 5], 3)).toEqual({ visible: [1, 2, 3], hidden: 2 });
    expect(splitTags([1], 3)).toEqual({ visible: [1], hidden: 0 });
  });
});
