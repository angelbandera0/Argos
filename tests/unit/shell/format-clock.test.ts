import { describe, expect, it } from "vitest";
import { formatClock } from "@/components/shell/format-clock";

describe("formatClock", () => {
  it("da día, fecha y hora en español", () => {
    expect(formatClock(new Date("2026-10-25T15:14:00Z"), "UTC")).toBe("Domingo, 25 de octubre · 15:14");
  });
  it("respeta la zona horaria y la hora de 24 h", () => {
    expect(formatClock(new Date("2026-10-26T00:05:00Z"), "America/Havana")).toBe("Domingo, 25 de octubre · 20:05");
    expect(formatClock(new Date("2026-03-02T03:07:00Z"), "UTC")).toBe("Lunes, 2 de marzo · 03:07");
  });
});
