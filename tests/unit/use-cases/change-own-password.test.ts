import { describe, expect, it } from "vitest";
import { makeChangeOwnPassword } from "@/core/application/use-cases/access/change-own-password";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, RuleViolation } from "@/core/domain/errors";
import { FakeAuthGateway } from "../../fakes/fake-auth-gateway";
import { InMemoryUserRepository } from "../../fakes/in-memory-user-repository";

function setup() {
  const users = new InMemoryUserRepository();
  const auth = new FakeAuthGateway(users);
  users.profiles.set("a1", {
    id: "a1",
    kind: "admin",
    username: null,
    displayName: "Ana",
    companyId: null,
    status: "active",
    mustChangePassword: true,
  });
  return { users, auth, changeOwnPassword: makeChangeOwnPassword({ auth, users }) };
}

const admin: Actor = { userId: "a1", kind: "admin", channel: "ui" };

describe("changeOwnPassword", () => {
  it("REQ-006 CA-04: 11 characters throws PASSWORD_TOO_SHORT and does not call the gateway", async () => {
    const { auth, users, changeOwnPassword } = setup();

    const error = await changeOwnPassword(admin, { newPassword: "12345678901" }).catch((e) => e);

    expect(error).toBeInstanceOf(RuleViolation);
    expect(error.code).toBe("PASSWORD_TOO_SHORT");
    expect(auth.setPasswordCalls).toEqual([]);
    expect((await users.getProfile("a1"))?.mustChangePassword).toBe(true);
  });

  it("REQ-006 CA-01c: 12 characters calls setPassword and clears mustChangePassword", async () => {
    const { auth, users, changeOwnPassword } = setup();

    await changeOwnPassword(admin, { newPassword: "123456789012" });

    expect(auth.setPasswordCalls).toEqual([{ userId: "a1", password: "123456789012" }]);
    expect(auth.passwords["a1"]).toBe("123456789012");
    expect((await users.getProfile("a1"))?.mustChangePassword).toBe(false);
  });

  it("superadmin can change their own password", async () => {
    const { auth, changeOwnPassword } = setup();
    const actor: Actor = { userId: "s1", kind: "superadmin", channel: "ui" };

    await changeOwnPassword(actor, { newPassword: "123456789012" });

    expect(auth.setPasswordCalls).toEqual([{ userId: "s1", password: "123456789012" }]);
  });

  it("an operator gets Forbidden (operators use a PIN)", async () => {
    const { auth, changeOwnPassword } = setup();
    const actor: Actor = { userId: "o1", kind: "operator", channel: "app" };

    await expect(
      changeOwnPassword(actor, { newPassword: "123456789012" }),
    ).rejects.toBeInstanceOf(Forbidden);
    expect(auth.setPasswordCalls).toEqual([]);
  });
});
