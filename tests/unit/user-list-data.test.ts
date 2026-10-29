import { describe, expect, it } from "vitest";
import { lastAccessLabel, matchesState, parsePage, parseState, storesSummary, userListQuery, userState } from "@/components/users/user-list-data";

const now = new Date("2026-10-29T15:00:00Z");

describe("user list data", () => {
  it("derives the state", () => {
    expect(userState("active", new Date())).toBe("active");
    expect(userState("active", null)).toBe("never");
    expect(userState("locked", null)).toBe("locked");
    expect(userState("deactivated", new Date())).toBe("inactive");
  });
  it("filters by state", () => {
    expect(matchesState("activos", "never")).toBe(true);
    expect(matchesState("inactivos", "active")).toBe(false);
    expect(parseState("x")).toBe("todos");
    expect(parseState("bloqueados")).toBe("bloqueados");
  });
  it("labels the last access", () => {
    expect(lastAccessLabel(null, now)).toBe("Nunca");
    expect(lastAccessLabel(new Date("2026-10-29T08:12:00Z"), now)).toBe("Hoy, 08:12");
    expect(lastAccessLabel(new Date("2026-10-28T18:05:00Z"), now)).toBe("Ayer, 18:05");
    expect(lastAccessLabel(new Date("2026-10-12T10:00:00Z"), now)).toBe("12 oct");
  });
  it("summarises stores", () => {
    expect(storesSummary(["A", "B"], 2).all).toBe(true);
    expect(storesSummary(["A"], 1)).toEqual({ all: false, first: "A", more: 0 });
    expect(storesSummary(["A", "B", "C"], 5)).toEqual({ all: false, first: "A", more: 2 });
    expect(storesSummary([], 3)).toEqual({ all: false, first: undefined, more: 0 });
  });
  it("builds pages and queries", () => {
    expect(parsePage("0")).toBe(1);
    expect(parsePage("3")).toBe(3);
    expect(userListQuery({ q: "a", estado: "activos", pagina: 2 })).toBe("?q=a&estado=activos&pagina=2");
    expect(userListQuery({ estado: "todos" })).toBe("");
  });
});
