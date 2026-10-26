import { describe, expect, it } from "vitest";
import { AVATAR_TONES, avatarTone, companyInitials } from "@/components/org/company-avatar";

describe("companyInitials", () => {
  it("toma hasta dos iniciales", () => {
    expect(companyInitials("La Nacion")).toBe("LN");
    expect(companyInitials("Casona del Sur")).toBe("CD");
    expect(companyInitials("Argos")).toBe("A");
    expect(companyInitials("  ")).toBe("?");
  });
});

describe("avatarTone", () => {
  it("es determinista y está dentro de la paleta", () => {
    expect(avatarTone("717d")).toBe(avatarTone("717d"));
    for (const c of ["717d", "qbt6", "a", "zzzz9"]) {
      const t = avatarTone(c);
      expect(t).toBeGreaterThanOrEqual(0);
      expect(t).toBeLessThan(AVATAR_TONES);
    }
  });
});
