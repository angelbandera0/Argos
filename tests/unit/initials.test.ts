import { describe, expect, it } from "vitest";
import { initials } from "@/components/shell/initials";

describe("initials", () => {
  it("toma las iniciales de las dos primeras palabras", () => {
    expect(initials("ana maría rivera")).toBe("AM");
  });
  it("funciona con una sola palabra y con espacios sobrantes", () => {
    expect(initials("  Admin ")).toBe("A");
  });
});
