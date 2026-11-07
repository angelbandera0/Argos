import { describe, expect, it } from "vitest";
import { STATUS_ORDER, dayRange } from "@/components/dashboard/today-requests-logic";

describe("today requests logic", () => {
  it("covers the company's calendar day as [from, to)", () => {
    expect(dayRange(new Date("2026-11-07T15:30:00Z"), "UTC")).toEqual({ createdFrom: "2026-11-07T00:00:00.000Z", createdTo: "2026-11-08T00:00:00.000Z" });
    expect(dayRange(new Date("2026-11-07T15:30:00Z"), "America/Bogota")).toEqual({ createdFrom: "2026-11-07T05:00:00.000Z", createdTo: "2026-11-08T05:00:00.000Z" });
  });
  it("changes day at the zone's midnight", () => {
    const instant = new Date("2026-11-08T03:00:00Z");
    expect(dayRange(instant, "UTC").createdFrom).toBe("2026-11-08T00:00:00.000Z");
    expect(dayRange(instant, "America/Bogota").createdFrom).toBe("2026-11-07T05:00:00.000Z");
    expect(dayRange(instant, "Asia/Tokyo").createdFrom).toBe("2026-11-07T15:00:00.000Z");
  });
  it("keeps a fixed status order", () => {
    expect(STATUS_ORDER[0].status).toBe("new");
  });
});
