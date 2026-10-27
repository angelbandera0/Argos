import { describe, expect, it } from "vitest";
import { effectiveExpiry, isExpired } from "@/core/domain/session";

const startedAt = new Date("2026-10-25T08:00:00Z");

describe("effectiveExpiry", () => {
  it("uses the 24 h cap when role has no limit", () => {
    expect(
      effectiveExpiry({ startedAt, companyCapSeconds: 86400, roleSeconds: null }),
    ).toEqual(new Date("2026-10-26T08:00:00Z"));
  });

  it("uses the role time when shorter", () => {
    expect(
      effectiveExpiry({ startedAt, companyCapSeconds: 86400, roleSeconds: 3600 }),
    ).toEqual(new Date("2026-10-25T09:00:00Z"));
  });

  it("uses the company cap when shorter than the role time", () => {
    expect(
      effectiveExpiry({ startedAt, companyCapSeconds: 7200, roleSeconds: 86400 }),
    ).toEqual(new Date("2026-10-25T10:00:00Z"));
  });

  it("never exceeds the absolute 24 h limit", () => {
    expect(
      effectiveExpiry({ startedAt, companyCapSeconds: 172800, roleSeconds: null }),
    ).toEqual(new Date("2026-10-26T08:00:00Z"));
  });
});

describe("isExpired", () => {
  const expiry = new Date("2026-10-25T09:00:00.000Z");

  it("is false one millisecond before expiry", () => {
    expect(isExpired(new Date("2026-10-25T08:59:59.999Z"), expiry)).toBe(false);
  });

  it("is true at the exact instant", () => {
    expect(isExpired(new Date("2026-10-25T09:00:00.000Z"), expiry)).toBe(true);
  });

  it("is true after expiry", () => {
    expect(isExpired(new Date("2026-10-25T09:00:00.001Z"), expiry)).toBe(true);
  });
});
