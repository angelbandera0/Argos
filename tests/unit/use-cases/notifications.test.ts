import { describe, expect, it } from "vitest";
import { makeCountUnreadNotifications } from "@/core/application/use-cases/notifications/count-unread-notifications";
import { makeListNotifications } from "@/core/application/use-cases/notifications/list-notifications";
import { makeMarkNotificationsRead } from "@/core/application/use-cases/notifications/mark-notifications-read";
import type { Actor } from "@/core/domain/actor";
import { InMemoryNotifications } from "../../fakes/in-memory-notifications";

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const me: Actor = { userId: "u1", kind: "operator", channel: "ui" };

function setup() {
  const repo = new InMemoryNotifications();
  repo.add("u1", { id: id(1), createdAt: new Date("2026-01-01"), priority: "urgent" });
  repo.add("u1", { id: id(2), createdAt: new Date("2026-01-02"), module: "orders" });
  repo.add("u1", { id: id(3), createdAt: new Date("2026-01-03"), readAt: new Date() });
  repo.add("u2", { id: id(4) });
  const deps = { notifications: repo };
  return {
    repo,
    list: makeListNotifications(deps),
    count: makeCountUnreadNotifications(deps),
    mark: makeMarkNotificationsRead(deps),
  };
}

describe("notifications use cases", () => {
  it("lists only the actor's, newest first, with total and paging", async () => {
    const { list } = setup();
    const r = await list(me, { pageSize: 2 });
    expect(r.total).toBe(3);
    expect(r.items.map((n) => n.id)).toEqual([id(3), id(2)]);
    expect((await list(me, { pageSize: 2, page: 2 })).items.map((n) => n.id)).toEqual([id(1)]);
  });

  it("filters by module, priority and read state", async () => {
    const { list } = setup();
    expect((await list(me, { module: "orders" })).total).toBe(1);
    expect((await list(me, { priority: "urgent" })).items[0].id).toBe(id(1));
    expect((await list(me, { read: "read" })).total).toBe(1);
    expect((await list(me, { read: "unread" })).total).toBe(2);
  });

  it("caps pageSize, makes `to` date-only inclusive and rejects bad input", async () => {
    const { list, repo } = setup();
    await list(me, { pageSize: 5000, to: "2026-01-02" });
    expect(repo.lastFilters?.to?.toISOString()).toBe("2026-01-02T23:59:59.999Z");
    for (const bad of [{ module: "x" }, { priority: "x" }, { read: "x" }, { storeId: "nope" }, { from: "zz" }, { page: 0 }, { pageSize: 0 }]) {
      await expect(list(me, bad)).rejects.toMatchObject({ code: "INVALID_INPUT" });
    }
  });

  it("counts unread and marks some or all, never another user's", async () => {
    const { count, mark, repo } = setup();
    expect(await count(me)).toBe(2);
    expect(await mark(me, { ids: [id(1), id(4)] })).toBe(1);
    expect(repo.rows.get(id(4))?.readAt).toBeNull();
    expect(await count(me)).toBe(1);
    expect(await mark(me)).toBe(1);
    expect(await count(me)).toBe(0);
    await expect(mark(me, { ids: ["x"] })).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });
});
