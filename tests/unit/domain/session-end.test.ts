import { describe, expect, it } from "vitest";
import { effectiveExpiry, formatSessionEnd } from "@/core/domain/session";

describe("formatSessionEnd", () => {
  it("shows the earliest of day, company cap and role time as HH:mm", () => {
    const end = effectiveExpiry({
      startedAt: new Date("2026-10-26T14:00:00Z"),
      companyCapSeconds: 8.5 * 3600,
      roleSeconds: 10 * 3600,
    });
    expect(formatSessionEnd(end, "UTC")).toBe("22:30");
  });
  it("caps at one day", () => {
    const end = effectiveExpiry({ startedAt: new Date("2026-10-26T08:15:00Z"), companyCapSeconds: 999999, roleSeconds: null });
    expect(formatSessionEnd(end, "UTC")).toBe("08:15");
  });
});
