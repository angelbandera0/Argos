import { describe, expect, it } from "vitest";
import { makeCreateAdmin } from "@/core/application/use-cases/access/create-admin";
import type { Actor } from "@/core/domain/actor";
import { Forbidden } from "@/core/domain/errors";
import { FakeAuthGateway } from "../../fakes/fake-auth-gateway";
import { InMemoryUserRepository } from "../../fakes/in-memory-user-repository";

function setup() {
  const users = new InMemoryUserRepository();
  const auth = new FakeAuthGateway(users);
  return { users, createAdmin: makeCreateAdmin({ auth, users }) };
}

const input = { email: "ana@example.com", displayName: "Ana" };

describe("createAdmin", () => {
  it("REQ-006 CA-03: superadmin creates an admin and gets a temporary password", async () => {
    const { users, createAdmin } = setup();
    const actor: Actor = { userId: "s1", kind: "superadmin", channel: "ui" };

    const result = await createAdmin(actor, input);

    expect(result.temporaryPassword.length).toBeGreaterThanOrEqual(12);
    const profile = await users.getProfile(result.adminId);
    expect(profile?.kind).toBe("admin");
    expect(profile?.displayName).toBe("Ana");
    expect(profile?.mustChangePassword).toBe(true);
  });

  it("REQ-006 CA-05: an admin gets Forbidden", async () => {
    const { users, createAdmin } = setup();
    const actor: Actor = { userId: "a1", kind: "admin", channel: "ui" };

    await expect(createAdmin(actor, input)).rejects.toBeInstanceOf(Forbidden);
    expect(users.profiles.size).toBe(0);
  });

  it("REQ-006 CA-05: an operator gets Forbidden", async () => {
    const { users, createAdmin } = setup();
    const actor: Actor = { userId: "o1", kind: "operator", channel: "app" };

    await expect(createAdmin(actor, input)).rejects.toBeInstanceOf(Forbidden);
    expect(users.profiles.size).toBe(0);
  });

  it("REQ-006 CA-02: creating an admin never produces a superadmin", async () => {
    const { users, createAdmin } = setup();
    const actor: Actor = { userId: "s1", kind: "superadmin", channel: "ui" };

    const first = await createAdmin(actor, input);
    const second = await createAdmin(actor, { email: "b@example.com", displayName: "B" });

    expect((await users.getProfile(first.adminId))?.kind).toBe("admin");
    expect((await users.getProfile(second.adminId))?.kind).toBe("admin");
    expect([...users.profiles.values()].some((p) => p.kind === "superadmin")).toBe(false);
  });
});
