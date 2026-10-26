import { describe, expect, it } from "vitest";
import {
  actionInfo,
  channelLabel,
  dateBounds,
  diffFields,
  filtersQuery,
  formatValue,
  parseFilters,
} from "@/components/history/history-utils";

describe("diffFields", () => {
  it("update lists only changed fields", () => {
    expect(diffFields("update", { name: "A", price: 1, active: true }, { name: "B", price: 1, active: true })).toEqual([
      { field: "name", before: "A", after: "B" },
    ]);
  });
  it("create and delete list the whole object", () => {
    expect(diffFields("create", null, { a: 1, b: 2 }).map((c) => c.field)).toEqual(["a", "b"]);
    expect(diffFields("delete", { a: 1 }, null)).toEqual([{ field: "a", before: 1, after: undefined }]);
  });
  it("never exposes sensitive keys", () => {
    const keys = diffFields("create", null, { name: "x", pin: "1234", pin_hash: "h", password: "p", credential: "c", nested: { password: "p", ok: 1 } }).map((c) => c.field);
    expect(keys).toEqual(["name", "nested"]);
    expect(JSON.stringify(diffFields("update", { pin: "1" }, { pin: "2", name: "n" }))).not.toMatch(/pin|"1"|"2"/);
  });
});

describe("labels and values", () => {
  it("labels actions and channels in Spanish", () => {
    expect(actionInfo("deactivate").label).toBe("Desactivación");
    expect(actionInfo("create").variant).toBe("success");
    expect(actionInfo("zzz").label).toBe("zzz");
    expect(channelLabel("system")).toBe("Sistema");
    expect(channelLabel("mcp")).toBe("MCP");
  });
  it("formats booleans, nulls and dates", () => {
    expect(formatValue(true)).toBe("Sí");
    expect(formatValue(false)).toBe("No");
    expect(formatValue(null)).toBe("—");
    expect(formatValue(undefined)).toBe("—");
    expect(formatValue("2026-10-25T15:14:00Z", "UTC")).toContain("2026");
    expect(formatValue(5)).toBe("5");
  });
});

describe("filters", () => {
  const id = "11111111-1111-1111-1111-111111111111";
  it("parses valid values and drops invalid ones", () => {
    expect(parseFilters({ usuario: id, desde: "2026-10-01", hasta: "2026-10-31", cursor: "abc_-1" })).toEqual({
      actor: id,
      from: "2026-10-01",
      to: "2026-10-31",
      cursor: "abc_-1",
    });
    expect(parseFilters({ usuario: "x", desde: "nope", hasta: ["2026-01-01"], cursor: "a b" })).toEqual({
      actor: undefined,
      from: undefined,
      to: undefined,
      cursor: undefined,
    });
  });
  it("builds searchParams, replacing the cursor", () => {
    expect(filtersQuery({})).toBe("");
    expect(filtersQuery({ actor: id, from: "2026-10-01", cursor: "old" }, "new")).toBe(`?usuario=${id}&desde=2026-10-01&cursor=new`);
  });
  it("makes the end date inclusive", () => {
    const b = dateBounds({ from: "2026-10-01", to: "2026-10-02" });
    expect(b.from?.toISOString()).toBe("2026-10-01T00:00:00.000Z");
    expect(b.to?.toISOString()).toBe("2026-10-02T23:59:59.999Z");
    expect(dateBounds({})).toEqual({ from: undefined, to: undefined });
  });
});
