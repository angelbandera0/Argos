import { describe, expect, it } from "vitest";
import { dayBoundsInTimeZone, dayHeading, dayKey, groupByDay, isValidTimeZone, rangeToInstants, resolveTimeZone } from "@/components/history/time-zone";

const iso = (d: Date) => d.toISOString();
const bounds = (day: string, tz: string) => {
  const b = dayBoundsInTimeZone(day, tz);
  return [iso(b.start), iso(b.end)];
};

describe("dayBoundsInTimeZone", () => {
  it("UTC is the plain calendar day", () => {
    expect(bounds("2026-10-26", "UTC")).toEqual(["2026-10-26T00:00:00.000Z", "2026-10-27T00:00:00.000Z"]);
  });
  it("uses the zone offset (west and east)", () => {
    expect(bounds("2026-10-26", "America/Caracas")).toEqual(["2026-10-26T04:00:00.000Z", "2026-10-27T04:00:00.000Z"]);
    expect(bounds("2026-10-26", "Asia/Tokyo")).toEqual(["2026-10-25T15:00:00.000Z", "2026-10-26T15:00:00.000Z"]);
  });
  it("handles half-hour and 45-minute offsets", () => {
    expect(bounds("2026-10-26", "Asia/Kolkata")).toEqual(["2026-10-25T18:30:00.000Z", "2026-10-26T18:30:00.000Z"]);
    expect(bounds("2026-10-26", "Asia/Kathmandu")).toEqual(["2026-10-25T18:15:00.000Z", "2026-10-26T18:15:00.000Z"]);
    expect(bounds("2026-10-26", "Australia/Adelaide")).toEqual(["2026-10-25T13:30:00.000Z", "2026-10-26T13:30:00.000Z"]);
  });
  it("DST: 23 h and 25 h days", () => {
    expect(bounds("2026-03-08", "America/New_York")).toEqual(["2026-03-08T05:00:00.000Z", "2026-03-09T04:00:00.000Z"]);
    expect(bounds("2026-11-01", "America/New_York")).toEqual(["2026-11-01T04:00:00.000Z", "2026-11-02T05:00:00.000Z"]);
    expect(bounds("2026-10-25", "Europe/Madrid")).toEqual(["2026-10-24T22:00:00.000Z", "2026-10-25T23:00:00.000Z"]);
  });
  it("DST gap at midnight starts at the first existing instant", () => {
    const [start] = bounds("2026-03-08", "America/Havana");
    expect(new Date(start).getTime()).toBe(Date.parse("2026-03-08T05:00:00.000Z"));
  });
  it("month and year ends", () => {
    expect(bounds("2026-02-28", "UTC")[1]).toBe("2026-03-01T00:00:00.000Z");
    expect(bounds("2028-02-29", "UTC")[1]).toBe("2028-03-01T00:00:00.000Z");
    expect(bounds("2026-12-31", "America/Caracas")).toEqual(["2026-12-31T04:00:00.000Z", "2027-01-01T04:00:00.000Z"]);
  });
  it("rejects an impossible day", () => {
    expect(() => dayBoundsInTimeZone("2026-02-30", "UTC")).toThrow(RangeError);
  });
  it("range to instants is [start of from, start of day after to)", () => {
    const r = rangeToInstants("2026-10-20", "2026-10-26", "America/Caracas");
    expect([iso(r.from!), iso(r.to!)]).toEqual(["2026-10-20T04:00:00.000Z", "2026-10-27T04:00:00.000Z"]);
    expect(rangeToInstants(undefined, undefined, "UTC")).toEqual({ from: undefined, to: undefined });
  });
});

describe("time zone cookie", () => {
  it("accepts IANA names and UTC, rejects junk", () => {
    expect(isValidTimeZone("America/Caracas")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("Nope/Zone")).toBe(false);
    expect(isValidTimeZone("a;b")).toBe(false);
    expect(isValidTimeZone(undefined)).toBe(false);
    expect(isValidTimeZone("A".repeat(80))).toBe(false);
  });
  it("falls back to UTC and says so", () => {
    expect(resolveTimeZone("Europe/Madrid")).toEqual({ tz: "Europe/Madrid", assumed: false });
    expect(resolveTimeZone(undefined)).toEqual({ tz: "UTC", assumed: true });
    expect(resolveTimeZone("bad zone")).toEqual({ tz: "UTC", assumed: true });
  });
});

describe("groupByDay", () => {
  const now = new Date("2026-10-27T02:30:00Z");
  it("cuts days in the user's zone and labels Hoy / Ayer", () => {
    expect(dayKey(now, "UTC")).toBe("2026-10-27");
    expect(dayKey(now, "America/Caracas")).toBe("2026-10-26");
    const rows = [
      { id: "1", createdAt: "2026-10-27T01:00:00Z" },
      { id: "2", createdAt: "2026-10-26T20:00:00Z" },
      { id: "3", createdAt: "2026-10-26T03:00:00Z" },
      { id: "4", createdAt: "2026-10-20T15:00:00Z" },
    ];
    const caracas = groupByDay(rows, "America/Caracas", now);
    expect(caracas.map((g) => [g.key, g.label, g.rows.map((r) => r.id)])).toEqual([
      ["2026-10-26", "Hoy · lunes 26 de octubre", ["1", "2"]],
      ["2026-10-25", "Ayer · domingo 25 de octubre", ["3"]],
      ["2026-10-20", "martes 20 de octubre", ["4"]],
    ]);
    const utc = groupByDay(rows, "UTC", now);
    expect(utc.map((g) => g.label)).toEqual(["Hoy · martes 27 de octubre", "Ayer · lunes 26 de octubre", "martes 20 de octubre"]);
  });
  it("adds the year to other years and keeps empty input empty", () => {
    expect(dayHeading("2025-12-31", "2026-10-26")).toBe("miércoles 31 de diciembre de 2025");
    expect(groupByDay([], "UTC", now)).toEqual([]);
  });
});
