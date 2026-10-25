import { describe, expect, it } from "vitest";
import { Forbidden, RuleViolation, SessionExpired } from "@/core/domain/errors";
import { HOUR, T0, operatorActor, setup } from "./session-setup";

describe("makeChooseStore", () => {
  it("REQ-006 CA-08: sets the active store", async () => {
    const { login, choose, sessions } = setup();
    await login({ username: "abcd.ana", pin: "123456" });
    await choose(operatorActor(), { storeId: "t1" });
    expect((await sessions.get("sess1"))?.activeStoreId).toBe("t1");
  });

  it("unavailable store -> STORE_UNAVAILABLE; unassigned store -> Forbidden; nothing changes", async () => {
    const { login, choose, sessions } = setup();
    await login({ username: "abcd.ana", pin: "123456" });
    const unavailable = await choose(operatorActor(), { storeId: "t4" }).catch((e: unknown) => e);
    expect(unavailable).toBeInstanceOf(RuleViolation);
    expect((unavailable as RuleViolation).code).toBe("STORE_UNAVAILABLE");
    await expect(choose(operatorActor(), { storeId: "zz" })).rejects.toBeInstanceOf(Forbidden);
    expect((await sessions.get("sess1"))?.activeStoreId).toBeNull();
  });
});

describe("makeSwitchStore", () => {
  it("REQ-006 CA-10: switch keeps startedAt", async () => {
    const { login, choose, switchStore, sessions, clock } = setup();
    await login({ username: "abcd.ana", pin: "123456" });
    await choose(operatorActor(), { storeId: "t1" });
    clock.advance(HOUR / 2);
    await switchStore(operatorActor(), { storeId: "t3" });
    expect(await sessions.get("sess1")).toMatchObject({ activeStoreId: "t3", startedAt: T0, endedAt: null });
  });

  it("requires an active store already; unavailable -> STORE_UNAVAILABLE", async () => {
    const { login, choose, switchStore, sessions } = setup();
    await login({ username: "abcd.ana", pin: "123456" });
    await expect(switchStore(operatorActor(), { storeId: "t1" })).rejects.toBeInstanceOf(Forbidden);
    await choose(operatorActor(), { storeId: "t1" });
    await expect(switchStore(operatorActor(), { storeId: "t4" })).rejects.toMatchObject({ code: "STORE_UNAVAILABLE" });
    expect((await sessions.get("sess1"))?.activeStoreId).toBe("t1");
  });

  it("REQ-006 CA-10b: shorter limit already elapsed -> SessionExpired and session ended", async () => {
    const { login, choose, switchStore, sessions, clock } = setup();
    await login({ username: "abcd.ana", pin: "123456" });
    await choose(operatorActor(), { storeId: "t1" });
    clock.advance(2 * HOUR); // t2 role limit is 3600 s
    const error = await switchStore(operatorActor(), { storeId: "t2" }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(SessionExpired);
    expect((error as Error).message).toBe("Session expired");
    expect(await sessions.get("sess1")).toMatchObject({
      activeStoreId: "t1",
      startedAt: T0,
      endedAt: new Date(T0.getTime() + 2 * HOUR),
    });
  });

  it("longer limit keeps working", async () => {
    const { login, choose, switchStore, sessions, clock } = setup();
    await login({ username: "abcd.ana", pin: "123456" });
    await choose(operatorActor(), { storeId: "t1" });
    clock.advance(2 * HOUR);
    await switchStore(operatorActor(), { storeId: "t3" }); // role 14400 s
    expect(await sessions.get("sess1")).toMatchObject({ activeStoreId: "t3", endedAt: null });
  });

  it("the 1-day cap holds with a 172800 s company cap", async () => {
    const { login, choose, switchStore, sessions, clock } = setup();
    await login({ username: "abcd.ana", pin: "123456" });
    await choose(operatorActor(), { storeId: "t1" });
    clock.advance(24 * HOUR - 1000);
    await switchStore(operatorActor(), { storeId: "t5" });
    expect((await sessions.get("sess1"))?.activeStoreId).toBe("t5");
    clock.advance(1000); // exactly 86400 s since start
    await expect(switchStore(operatorActor(), { storeId: "t5" })).rejects.toBeInstanceOf(SessionExpired);
    expect((await sessions.get("sess1"))?.endedAt).not.toBeNull();
  });
});

describe("REVIEW FOCUS 3: expired sessions", () => {
  it("past expiry every operator use case throws SessionExpired", async () => {
    const { login, choose, assertActive, clock, sessions } = setup();
    await login({ username: "abcd.ana", pin: "123456" });
    await choose(operatorActor(), { storeId: "t2" }); // role limit 3600 s
    clock.advance(HOUR);
    await expect(assertActive(operatorActor())).rejects.toBeInstanceOf(SessionExpired);
    expect((await sessions.get("sess1"))?.endedAt).toEqual(new Date(T0.getTime() + HOUR));
  });

  it("choose and switch throw SessionExpired regardless of the target store", async () => {
    const a = setup();
    await a.login({ username: "abcd.ana", pin: "123456" });
    a.clock.advance(24 * HOUR); // no active store: 1-day fallback
    await expect(a.choose(operatorActor(), { storeId: "t1" })).rejects.toBeInstanceOf(SessionExpired);
    expect(await a.sessions.get("sess1")).toMatchObject({ activeStoreId: null, endedAt: new Date(T0.getTime() + 24 * HOUR) });
    const b = setup();
    await b.login({ username: "abcd.ana", pin: "123456" });
    await b.choose(operatorActor(), { storeId: "t2" });
    b.clock.advance(HOUR);
    await expect(b.switchStore(operatorActor(), { storeId: "t3" })).rejects.toBeInstanceOf(SessionExpired);
    await expect(b.choose(operatorActor(), { storeId: "zz" })).rejects.toBeInstanceOf(SessionExpired);
    expect((await b.sessions.get("sess1"))?.activeStoreId).toBe("t2");
  });

  it("an ended or missing session throws SessionExpired", async () => {
    const { login, logout, assertActive, choose, sessions } = setup();
    await login({ username: "abcd.ana", pin: "123456" });
    await logout(operatorActor());
    const endedAt = (await sessions.get("sess1"))?.endedAt;
    await expect(assertActive(operatorActor())).rejects.toBeInstanceOf(SessionExpired);
    await expect(choose(operatorActor(), { storeId: "t1" })).rejects.toBeInstanceOf(SessionExpired);
    await expect(assertActive(operatorActor("nope"))).rejects.toBeInstanceOf(SessionExpired);
    expect((await sessions.get("sess1"))?.endedAt).toEqual(endedAt);
  });

  it("non-operator or missing sessionId -> Forbidden", async () => {
    const { assertActive } = setup();
    await expect(assertActive({ userId: "a", kind: "admin", channel: "ui", sessionId: "sess1" })).rejects.toBeInstanceOf(Forbidden);
    await expect(assertActive(operatorActor(null))).rejects.toBeInstanceOf(Forbidden);
  });

  it("active session returns the session", async () => {
    const { login, assertActive } = setup();
    await login({ username: "abcd.ana", pin: "123456" });
    const { session, activeStore } = await assertActive(operatorActor());
    expect(session).toMatchObject({ sessionId: "sess1", startedAt: T0 });
    expect(activeStore).toBeNull();
  });
});

describe("makeLogout", () => {
  it("ends the session, is idempotent and a no-op without sessionId", async () => {
    const { login, logout, sessions, clock } = setup();
    await login({ username: "abcd.ana", pin: "123456" });
    clock.advance(1000);
    await logout(operatorActor());
    const ended = new Date(T0.getTime() + 1000);
    expect((await sessions.get("sess1"))?.endedAt).toEqual(ended);
    clock.advance(1000);
    await logout(operatorActor());
    await logout(operatorActor("unknown"));
    await logout(operatorActor(null));
    expect((await sessions.get("sess1"))?.endedAt).toEqual(ended);
  });
});
