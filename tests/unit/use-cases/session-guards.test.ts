import { describe, expect, it } from "vitest";
import { Forbidden, SessionExpired } from "@/core/domain/errors";
import { HOUR, T0, operatorActor, setup } from "./session-setup";

describe("requireOperatorStore and mid-session changes", () => {
  it("returns session and store when the active store is still operational", async () => {
    const s = setup();
    await s.login({ username: "abcd.ana", pin: "123456" });
    await s.choose(operatorActor(), { storeId: "t1" });
    const r = await s.requireStore(operatorActor());
    expect(r.store.storeId).toBe("t1");
    expect(r.session.sessionId).toBe("sess1");
  });

  it("no active store -> Forbidden", async () => {
    const s = setup();
    await s.login({ username: "abcd.ana", pin: "123456" });
    await expect(s.requireStore(operatorActor())).rejects.toBeInstanceOf(Forbidden);
  });

  it("assignment removed mid-session -> Forbidden, but choosing another store still works", async () => {
    const s = setup();
    await s.login({ username: "abcd.ana", pin: "123456" });
    await s.choose(operatorActor(), { storeId: "t1" });
    s.access.byUser.u1 = s.access.byUser.u1!.filter((a) => a.storeId !== "t1");
    expect((await s.assertActive(operatorActor())).activeStore).toBeNull();
    await expect(s.requireStore(operatorActor())).rejects.toBeInstanceOf(Forbidden);
    await s.choose(operatorActor(), { storeId: "t3" });
    expect((await s.requireStore(operatorActor())).store.storeId).toBe("t3");
  });

  it("active store deactivated mid-session -> STORE_UNAVAILABLE, switching to another store works", async () => {
    const s = setup();
    await s.login({ username: "abcd.ana", pin: "123456" });
    await s.choose(operatorActor(), { storeId: "t1" });
    s.access.byUser.u1 = s.access.byUser.u1!.map((a) => (a.storeId === "t1" ? { ...a, operational: false } : a));
    expect((await s.assertActive(operatorActor())).activeStore).toBeNull();
    await expect(s.requireStore(operatorActor())).rejects.toMatchObject({ name: "RuleViolation", code: "STORE_UNAVAILABLE" });
    await s.switchStore(operatorActor(), { storeId: "t3" });
    expect((await s.requireStore(operatorActor())).store.storeId).toBe("t3");
  });

  it("requireOperatorStore past expiry -> SessionExpired", async () => {
    const s = setup();
    await s.login({ username: "abcd.ana", pin: "123456" });
    await s.choose(operatorActor(), { storeId: "t2" });
    s.clock.advance(HOUR);
    await expect(s.requireStore(operatorActor())).rejects.toBeInstanceOf(SessionExpired);
  });
});

describe("session ownership", () => {
  it("another user's session: assert/choose -> SessionExpired, session untouched; logout is a no-op", async () => {
    const s = setup();
    await s.sessions.start({ sessionId: "other", userId: "u9", startedAt: T0 });
    const intruder = operatorActor("other"); // userId u1
    await expect(s.assertActive(intruder)).rejects.toBeInstanceOf(SessionExpired);
    await expect(s.choose(intruder, { storeId: "t1" })).rejects.toBeInstanceOf(SessionExpired);
    await s.logout(intruder);
    expect(await s.sessions.get("other")).toEqual({ sessionId: "other", userId: "u9", startedAt: T0, activeStoreId: null, endedAt: null });
  });
});

describe("expiry limits", () => {
  it("company cap below role seconds wins (3600 vs 7200)", async () => {
    const s = setup();
    await s.login({ username: "abcd.ana", pin: "123456" });
    s.clock.advance(3600 * 1000);
    await expect(s.choose(operatorActor(), { storeId: "t6" })).rejects.toBeInstanceOf(SessionExpired);
  });

  it("role seconds above 86400 are clamped to 86400", async () => {
    const s = setup();
    await s.login({ username: "abcd.ana", pin: "123456" });
    s.clock.advance(24 * HOUR - 1000);
    await s.choose(operatorActor(), { storeId: "t7" });
    s.clock.advance(1000);
    await expect(s.assertActive(operatorActor())).rejects.toBeInstanceOf(SessionExpired);
  });
});
