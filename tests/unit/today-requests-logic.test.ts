import { describe, expect, it } from "vitest";
import { countByStatus, dayRange } from "@/components/dashboard/today-requests-logic";

describe("today requests logic", () => {
  it("covers the local day as [from, to)", () => {
    const { createdFrom, createdTo } = dayRange(new Date(2026, 10, 7, 15, 30));
    expect(new Date(createdFrom).getTime()).toBe(new Date(2026, 10, 7).getTime());
    expect(new Date(createdTo).getTime()).toBe(new Date(2026, 10, 8).getTime());
  });
  it("counts by status in fixed order, omitting empty ones", () => {
    const r = countByStatus([{ status: "fulfilled" }, { status: "new" }, { status: "new" }]);
    expect(r.map((x) => [x.status, x.count])).toEqual([["new", 2], ["fulfilled", 1]]);
  });
});
