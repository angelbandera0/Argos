import { describe, expect, it } from "vitest";
import {
  actionInfo,
  channelLabel,
  ACTION_KEYS,
  diffFields,
  entityName,
  filtersQuery,
  formatValue,
  hasActiveFilters,
  pageLinks,
  parseHistoryParams,
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
    expect(actionInfo("update").variant).toBe("warning");
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

describe("searchParams", () => {
  const id = "11111111-1111-1111-1111-111111111111";
  const parse = (sp: Record<string, string | string[] | undefined>) => parseHistoryParams(sp, ACTION_KEYS);

  it("parses valid values and drops invalid ones", () => {
    const { filters, invalidDates } = parse({ usuario: id, accion: "create,update,zzz,create", canal: "app", desde: "2026-10-01", hasta: "2026-10-31", cursor: "abc_-1", prev: "~.abc" });
    expect(invalidDates).toBe(false);
    expect(filters).toEqual({ actor: id, actions: ["create", "update"], channel: "app", from: "2026-10-01", to: "2026-10-31", cursor: "abc_-1", prev: ["~", "abc"] });
    const bad = parse({ usuario: "x", canal: "tv", desde: "nope", hasta: ["2026-01-01"], cursor: "a b", prev: "a b.c" });
    expect(bad.filters).toEqual({ actor: undefined, actions: [], channel: undefined, from: undefined, to: undefined, cursor: undefined, prev: ["c"] });
    expect(bad.invalidDates).toBe(true);
  });
  it("swaps a reversed range and flags impossible dates", () => {
    const r = parse({ desde: "2026-10-26", hasta: "2026-10-20" });
    expect(r.filters).toMatchObject({ from: "2026-10-20", to: "2026-10-26" });
    expect(r.invalidDates).toBe(false);
    const bad = parse({ desde: "2026-02-30", hasta: "2026-10-20" });
    expect(bad.filters).toMatchObject({ from: undefined, to: "2026-10-20" });
    expect(bad.invalidDates).toBe(true);
    expect(parse({ desde: "2026-10-20" }).filters).toMatchObject({ from: "2026-10-20", to: undefined });
  });
  it("builds searchParams and detects active filters", () => {
    const f = parse({ usuario: id, accion: "create,delete", desde: "2026-10-01" }).filters;
    expect(filtersQuery({})).toBe("");
    expect(filtersQuery(f, { cursor: "new", prev: ["~", "c1"] })).toBe(`?usuario=${id}&accion=create%2Cdelete&desde=2026-10-01&cursor=new&prev=%7E.c1`);
    expect(hasActiveFilters(parse({}).filters)).toBe(false);
    expect(hasActiveFilters(f)).toBe(true);
  });
  it("walks the cursor stack back and forth", () => {
    const first = parse({}).filters;
    expect(pageLinks(first, null)).toEqual({ page: 1, prev: null, next: null });
    const toSecond = pageLinks(first, "c1");
    expect(toSecond.next).toEqual({ cursor: "c1", prev: ["~"] });
    const second = { ...first, cursor: "c1", prev: ["~"] };
    const toThird = pageLinks(second, "c2");
    expect(toThird.next).toEqual({ cursor: "c2", prev: ["~", "c1"] });
    expect(toThird.prev).toEqual({ cursor: undefined, prev: [] });
    expect(pageLinks({ ...first, cursor: "c2", prev: ["~", "c1"] }, null)).toMatchObject({ page: 3, prev: { cursor: "c1", prev: ["~"] } });
  });
});

describe("entityName", () => {
  it("picks a display name and never a sensitive key", () => {
    expect(entityName({ name: "Old" }, { name: "Café" })).toBe("Café");
    expect(entityName({ username: "k7m2.ana" }, null)).toBe("k7m2.ana");
    expect(entityName({ pin: "1234" }, { password: "x" })).toBeUndefined();
  });
});
