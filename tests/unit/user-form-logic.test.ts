import { describe, expect, it } from "vitest";
import { checklist, cleanUsername, groupBySite, groupState, suggestUsername, usernameFormat } from "@/components/users/user-form-logic";

describe("user form logic", () => {
  it("cleans the username", () => expect(cleanUsername(" Marta.L ")).toBe("marta.l"));
  it("checks format", () => {
    expect(usernameFormat("")).toBe("empty");
    expect(usernameFormat("a")).toBe("invalid");
    expect(usernameFormat("marta.l")).toBe("invalid");
    expect(usernameFormat("marta-l")).toBe("ok");
  });
  it("suggests from the name", () => {
    expect(suggestUsername("Marta López")).toBe("marta-l");
    expect(suggestUsername("Ángel")).toBe("angel");
    expect(suggestUsername("  ")).toBe("");
    expect(suggestUsername("X")).toBe("");
  });
  it("groups stores by site and computes mixed state", () => {
    const g = groupBySite([{ site: "A", id: 1 }, { site: "B", id: 2 }, { site: "A", id: 3 }]);
    expect(g.map((x) => [x.site, x.stores.length])).toEqual([["A", 2], ["B", 1]]);
    expect([groupState(0, 2), groupState(1, 2), groupState(2, 2)]).toEqual(["none", "some", "all"]);
  });
  it("checklist completes only with everything", () => {
    expect(checklist({ name: "M", username: "ok", hasRole: true, stores: 1 }).complete).toBe(true);
    const c = checklist({ name: "M", username: "other", hasRole: true, stores: 0 });
    expect(c.complete).toBe(false);
    expect(c.items.map((i) => i.state)).toEqual(["ok", "todo", "ok", "todo"]);
  });
});
