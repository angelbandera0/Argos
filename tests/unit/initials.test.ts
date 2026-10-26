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

import { profileSubtitle } from "@/components/shell/initials";

describe("profileSubtitle", () => {
  it("une usuario y rol, y omite el usuario si no existe", () => {
    expect(profileSubtitle("k7m2.ana", "Cajera")).toBe("k7m2.ana · Cajera");
    expect(profileSubtitle(null, "Administrador")).toBe("Administrador");
  });
});
