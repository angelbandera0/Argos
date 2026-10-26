import { describe, expect, it } from "vitest";
import { operatorNav } from "@/components/shell/catalog-nav";

const set = (view: boolean) => ({ view, create: false, edit: false, delete: false });

describe("operatorNav", () => {
  it("shows Productos only with view", () => {
    expect(operatorNav(set(true)).map((i) => i.id)).toEqual(["productos"]);
    expect(operatorNav(set(false))).toEqual([]);
  });
});
