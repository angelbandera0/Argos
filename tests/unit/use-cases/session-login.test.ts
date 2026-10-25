import { describe, expect, it } from "vitest";
import { AuthFailed } from "@/core/domain/errors";
import { T0, setup } from "./session-setup";

describe("makeLoginWithPin", () => {
  it("REQ-006 CA-08: returns all assigned stores with the available flag and starts the session once", async () => {
    const { login, sessions } = await setup();
    const result = await login({ username: "abcd.ana", pin: "123456" });
    expect(result.userId).toBe("u1");
    expect(result.sessionId).toBe("sess1");
    expect(result.stores.map((s) => [s.storeId, s.available])).toEqual([
      ["t1", true],
      ["t2", true],
      ["t3", true],
      ["t4", false],
      ["t5", true],
    ]);
    expect(result.stores[3]).toMatchObject({ storeName: "Store t4", operational: false, available: false });
    expect(sessions.startCalls).toEqual([{ sessionId: "sess1", userId: "u1", startedAt: T0 }]);
    expect(await sessions.get("sess1")).toEqual({
      sessionId: "sess1",
      userId: "u1",
      startedAt: T0,
      activeStoreId: null,
      endedAt: null,
    });
  });

  it("REQ-006 CA-12b: unknown user, wrong PIN, locked, deactivated, admin and missing profile fail identically", async () => {
    const { login, sessions } = await setup();
    const attempts = [
      { username: "abcd.nobody", pin: "123456" },
      { username: "abcd.ana", pin: "000000" },
      { username: "abcd.lock", pin: "123456" },
      { username: "abcd.gone", pin: "123456" },
      { username: "abcd.boss", pin: "123456" },
      { username: "abcd.ghost", pin: "123456" },
    ];
    for (const attempt of attempts) {
      const error = await login(attempt).catch((e: unknown) => e);
      expect(error).toBeInstanceOf(AuthFailed);
      expect((error as Error).name).toBe("AuthFailed");
      expect((error as Error).message).toBe("Usuario o PIN incorrectos");
      expect((error as Error).message).not.toContain(attempt.username);
      expect((error as Error).message).not.toContain(attempt.pin);
    }
    expect(sessions.startCalls).toEqual([]);
    expect(sessions.sessions.size).toBe(0);
  });
});
