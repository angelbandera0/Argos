import { describe, expect, it } from "vitest";
import type { HistoryEntry } from "@/core/application/ports/history-reader";
import { makeCountAuthEvents, makeCountHistory } from "@/core/application/use-cases/history/count-history";
import { makeListAuthEvents } from "@/core/application/use-cases/history/list-auth-events";
import { makeListHistory } from "@/core/application/use-cases/history/list-history";
import { stripSensitive } from "@/core/application/use-cases/history/sanitize";
import { InMemoryHistory } from "../../fakes/in-memory-history";
import { admin, operator, setup, superadmin } from "./catalog-setup";

const entry = (id: string, module: string, extra: Partial<HistoryEntry & { companyId: string }> = {}): HistoryEntry & { companyId: string } => ({
  id,
  companyId: "c1",
  module,
  entityType: "products",
  entityId: "e1",
  action: "update",
  actorId: "u-all",
  storeId: "t-u-all",
  channel: "ui",
  before: { name: "a" },
  after: { name: "b" },
  createdAt: new Date("2026-01-01T10:00:00Z"),
  ...extra,
});

function make() {
  const { deps: base } = setup();
  const history = new InMemoryHistory();
  history.entries.push(entry("h1", "products"), entry("h2", "roles"), entry("h3", "products", { companyId: "c2" }));
  history.authEvents.push(
    { id: "x1", companyId: "c1", userId: "u-all", usernameAttempted: null, event: "login_ok", actorId: null, channel: "app", createdAt: new Date() },
    { id: "x2", companyId: "c2", userId: "u-other", usernameAttempted: null, event: "locked", actorId: null, channel: "system", createdAt: new Date() },
  );
  const deps = { ...base, history };
  return { history, list: makeListHistory(deps), listAuth: makeListAuthEvents(deps), count: makeCountHistory(deps), countAuth: makeCountAuthEvents(deps) };
}

describe("history (REQ-009)", () => {
  it("CA-04/05: operator without view gets Forbidden; with view only gets that module's rows", async () => {
    const { list } = make();
    await expect(list(operator("u-none"), { module: "products" })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(list(operator("u-all"), {})).rejects.toMatchObject({ name: "Forbidden" });
    await expect(list(operator("u-all"), { module: "roles" })).rejects.toMatchObject({ name: "Forbidden" });
    const page = await list(operator("u-view"), { module: "products", companyId: "c2" });
    expect(page.items.map((e) => e.id)).toEqual(["h1"]);
  });

  it("CA-09: module, user and date filters reach the reader", async () => {
    const { list, history } = make();
    const from = new Date("2026-01-01T00:00:00Z");
    const to = new Date("2026-02-01T00:00:00Z");
    await list(admin("a1"), { companyId: "c1", module: "roles", actorId: "u-all", from, to });
    expect(history.lastList).toMatchObject({ companyId: "c1", module: "roles", actorId: "u-all", from, to });
  });

  it("admins see their companies only; the superadmin sees all", async () => {
    const { list } = make();
    expect((await list(admin("a1"), { companyId: "c1" })).items.map((e) => e.id).sort()).toEqual(["h1", "h2"]);
    await expect(list(admin("a1"), { companyId: "c2" })).rejects.toMatchObject({ name: "Forbidden" });
    await expect(list(admin("a1"), {})).rejects.toMatchObject({ name: "Forbidden" });
    expect((await list(superadmin, {})).items).toHaveLength(3);
  });

  it("CA-07: auth events are admin-only and scoped to the admin's company", async () => {
    const { listAuth } = make();
    await expect(listAuth(operator("u-all"), {})).rejects.toMatchObject({ name: "Forbidden" });
    expect((await listAuth(admin("a1"), { companyId: "c1" })).items.map((e) => e.id)).toEqual(["x1"]);
    await expect(listAuth(admin("a1"), { companyId: "c2" })).rejects.toMatchObject({ name: "Forbidden" });
    expect((await listAuth(superadmin, {})).items).toHaveLength(2);
  });

  it("Review Focus 2: pin, password and credential keys never come back, at any depth", async () => {
    const { list, history } = make();
    history.entries.push(
      entry("h4", "products", {
        before: { name: "a", pin: "1234", nested: { Password: "x", list: [{ pin_hash: 1, credential: 2, ok: 3 }] } },
        after: { shipping: "keep", admin_password: "y", credentials: "z" },
      }),
    );
    const page = await list(admin("a1"), { companyId: "c1" });
    const h4 = page.items.find((e) => e.id === "h4")!;
    expect(h4.before).toEqual({ name: "a", nested: { list: [{ ok: 3 }] } });
    expect(h4.after).toEqual({ shipping: "keep" });
    expect(stripSensitive({ a: [{ pin: 1, b: 2 }] })).toEqual({ a: [{ b: 2 }] });
  });

  it("pages with a stable cursor", async () => {
    const { list, history } = make();
    for (let i = 0; i < 5; i++) history.entries.push(entry(`p${i}`, "products"));
    const seen: string[] = [];
    let cursor: string | undefined;
    do {
      const page = await list(admin("a1"), { companyId: "c1", module: "products", limit: 2, cursor });
      seen.push(...page.items.map((e) => e.id));
      cursor = page.nextCursor ?? undefined;
    } while (cursor);
    expect(seen).toHaveLength(6);
    expect(new Set(seen).size).toBe(6);
  });

  it("filters by action, channel, several modules and an exclusive end", async () => {
    const { list, history } = make();
    history.entries.push(
      entry("f1", "products", { action: "create", channel: "app", createdAt: new Date("2026-02-01T00:00:00Z") }),
      entry("f2", "roles", { action: "delete", createdAt: new Date("2026-01-31T23:59:59Z") }),
    );
    const ids = async (i: Parameters<typeof list>[1]) => (await list(admin("a1"), { companyId: "c1", ...i })).items.map((e) => e.id).sort();
    expect(await ids({ actions: ["create"] })).toEqual(["f1"]);
    expect(await ids({ actions: ["create", "delete"], channel: "ui" })).toEqual(["f2"]);
    expect(await ids({ modules: ["roles"] })).toEqual(["f2", "h2"]);
    expect(await ids({ to: new Date("2026-02-01T00:00:00Z") })).toEqual(["f2", "h1", "h2"]);
  });

  it("operator: modules list needs «Ver» on every module", async () => {
    const { list } = make();
    expect((await list(operator("u-view"), { modules: ["products"] })).items.map((e) => e.id)).toEqual(["h1"]);
    await expect(list(operator("u-view"), { modules: ["products", "roles"] })).rejects.toMatchObject({ name: "Forbidden" });
  });

  it("counts per module with the filters; operators only get modules they can view", async () => {
    const { count, history } = make();
    history.entries.push(entry("k1", "products", { action: "create", channel: "app" }));
    expect(await count(admin("a1"), { companyId: "c1", modules: ["products", "roles", "users"] })).toEqual({ products: 2, roles: 1, users: 0 });
    expect(await count(admin("a1"), { companyId: "c1", modules: ["products"], actions: ["create"], channel: "app" })).toEqual({ products: 1 });
    expect(await count(admin("a1"), { companyId: "c1", modules: ["products"], from: new Date("2027-01-01T00:00:00Z") })).toEqual({ products: 0 });
    expect(await count(operator("u-view"), { modules: ["products", "roles"] })).toEqual({ products: 2 });
    expect(await count(operator("u-none"), { modules: ["products"] })).toEqual({});
    await expect(count(admin("a1"), { companyId: "c2", modules: ["products"] })).rejects.toMatchObject({ name: "Forbidden" });
    expect(await count(superadmin, { modules: ["products"] })).toEqual({ products: 3 });
  });

  it("counts and filters auth events (admins only)", async () => {
    const { countAuth, listAuth, history } = make();
    history.authEvents.push({ id: "x3", companyId: "c1", userId: "u-view", usernameAttempted: null, event: "login_failed", actorId: null, channel: "ui", createdAt: new Date("2026-01-01T00:00:00Z") });
    expect(await countAuth(admin("a1"), { companyId: "c1" })).toBe(2);
    expect(await countAuth(admin("a1"), { companyId: "c1", events: ["login_failed"] })).toBe(1);
    expect(await countAuth(admin("a1"), { companyId: "c1", userId: "u-all", channel: "app" })).toBe(1);
    expect((await listAuth(admin("a1"), { companyId: "c1", events: ["login_failed"] })).items.map((e) => e.id)).toEqual(["x3"]);
    await expect(countAuth(operator("u-all"), {})).rejects.toMatchObject({ name: "Forbidden" });
    await expect(countAuth(admin("a1"), { companyId: "c2" })).rejects.toMatchObject({ name: "Forbidden" });
  });
});
