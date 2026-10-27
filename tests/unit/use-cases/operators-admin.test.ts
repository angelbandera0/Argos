import { describe, expect, it } from "vitest";
import { Forbidden, NotFound } from "@/core/domain/errors";
import { adminA, adminB, operator, outsider, setup, superadmin } from "./operators-setup";

describe("makeResetPin", () => {
  it("REQ-006 CA-12: returns a new PIN and revokes sessions", async () => {
    const { resetPin, auth } = await setup();
    expect(await resetPin(adminA, { userId: "u1" })).toEqual({ pin: "100001" });
    expect(auth.resetPinCalls).toEqual(["u1"]);
    expect(auth.revokedSessions).toEqual(["u1"]);
  });

  it("any administrator of the company can, even if it does not own the role (REQ-007 CA-11)", async () => {
    const { resetPin, auth } = await setup();
    await resetPin(adminB, { userId: "u1" });
    expect(auth.resetPinCalls).toEqual(["u1"]);
  });

  it("superadmin, operator and admin without access get Forbidden; nothing changes", async () => {
    const { resetPin, auth } = await setup();
    for (const actor of [superadmin, operator, outsider]) {
      await expect(resetPin(actor, { userId: "u1" })).rejects.toBeInstanceOf(Forbidden);
    }
    await expect(resetPin(adminA, { userId: "u2" })).rejects.toBeInstanceOf(Forbidden);
    await expect(resetPin(adminA, { userId: "ghost" })).rejects.toBeInstanceOf(Forbidden);
    await expect(resetPin(adminA, { userId: "adm" })).rejects.toBeInstanceOf(NotFound);
    expect(auth.resetPinCalls).toEqual([]);
    expect(auth.revokedSessions).toEqual([]);
  });
});

describe("deactivated targets", () => {
  it("reset PIN on a deactivated user -> NotFound with no gateway call", async () => {
    const { resetPin, auth } = await setup();
    await expect(resetPin(adminA, { userId: "u4" })).rejects.toBeInstanceOf(NotFound);
    expect(auth.resetPinCalls).toEqual([]);
    expect(auth.revokedSessions).toEqual([]);
  });

  it("deactivating again -> NotFound with no mutation", async () => {
    const { deactivate, users, auth } = await setup();
    await expect(deactivate(adminA, { userId: "u4" })).rejects.toBeInstanceOf(NotFound);
    expect(users.statusCalls).toEqual([]);
    expect(auth.revokedSessions).toEqual([]);
  });
});

describe("makeUnlockUser", () => {
  it("REQ-006 CA-12: new PIN, status active, sessions revoked", async () => {
    const { unlock, users, auth } = await setup();
    expect(await unlock(adminA, { userId: "u3" })).toEqual({ pin: "100001" });
    expect((await users.getProfile("u3"))?.status).toBe("active");
    expect(users.statusCalls).toEqual([{ userId: "u3", status: "active" }]);
    expect(auth.revokedSessions).toEqual(["u3"]);
  });

  it("a non-owner administrator of the company can unlock", async () => {
    const { unlock } = await setup();
    expect(await unlock(adminB, { userId: "u3" })).toEqual({ pin: "100001" });
  });

  it("deactivated -> NotFound, admin profile -> NotFound, missing -> Forbidden; no gateway calls", async () => {
    const { unlock, users, auth } = await setup();
    await expect(unlock(adminA, { userId: "u4" })).rejects.toBeInstanceOf(NotFound);
    await expect(unlock(adminA, { userId: "adm" })).rejects.toBeInstanceOf(NotFound);
    await expect(unlock(adminA, { userId: "ghost" })).rejects.toBeInstanceOf(Forbidden);
    expect(auth.resetPinCalls).toEqual([]);
    expect(auth.revokedSessions).toEqual([]);
    expect(users.statusCalls).toEqual([]);
  });

  it("user that is not locked -> NotFound; nothing changes", async () => {
    const { unlock, users, auth } = await setup();
    await expect(unlock(adminA, { userId: "u1" })).rejects.toBeInstanceOf(NotFound);
    expect(auth.resetPinCalls).toEqual([]);
    expect(users.statusCalls).toEqual([]);
  });

  it("superadmin, operator and admin without access get Forbidden", async () => {
    const { unlock, users, auth } = await setup();
    for (const actor of [superadmin, operator, outsider]) {
      await expect(unlock(actor, { userId: "u3" })).rejects.toBeInstanceOf(Forbidden);
    }
    expect((await users.getProfile("u3"))?.status).toBe("locked");
    expect(auth.resetPinCalls).toEqual([]);
    expect(auth.revokedSessions).toEqual([]);
  });
});

describe("makeDeactivateUser", () => {
  it("REQ-007 CA-11: a non-owner administrator can deactivate; sessions revoked", async () => {
    const { deactivate, users, auth } = await setup();
    await deactivate(adminB, { userId: "u1" });
    expect((await users.getProfile("u1"))?.status).toBe("deactivated");
    expect(auth.revokedSessions).toEqual(["u1"]);
  });

  it("superadmin, operator and admin without access get Forbidden; non-operator NotFound", async () => {
    const { deactivate, users, auth } = await setup();
    for (const actor of [superadmin, operator, outsider]) {
      await expect(deactivate(actor, { userId: "u1" })).rejects.toBeInstanceOf(Forbidden);
    }
    await expect(deactivate(adminA, { userId: "u2" })).rejects.toBeInstanceOf(Forbidden);
    await expect(deactivate(adminA, { userId: "adm" })).rejects.toBeInstanceOf(NotFound);
    expect(users.statusCalls).toEqual([]);
    expect(auth.revokedSessions).toEqual([]);
  });
});
