import { describe, expect, it } from "vitest";
import { makeListAdmins } from "@/core/application/use-cases/access/list-admins";
import { Forbidden } from "@/core/domain/errors";
import { InMemoryUserRepository } from "../../fakes/in-memory-user-repository";

const profile = (id: string, kind: "admin" | "operator") => ({
  id,
  kind,
  username: null,
  displayName: id,
  companyId: null,
  status: "active" as const,
  mustChangePassword: false,
});

describe("listAdmins", () => {
  it("REQ-006: the superadmin lists only administrators", async () => {
    const users = new InMemoryUserRepository();
    users.profiles.set("a1", profile("a1", "admin"));
    users.profiles.set("o1", profile("o1", "operator"));
    const list = await makeListAdmins({ users })({ userId: "s", kind: "superadmin", channel: "ui" });
    expect(list.map((p) => p.id)).toEqual(["a1"]);
  });

  it("REQ-006: an admin or operator gets Forbidden", async () => {
    const list = makeListAdmins({ users: new InMemoryUserRepository() });
    await expect(list({ userId: "a", kind: "admin", channel: "ui" })).rejects.toBeInstanceOf(Forbidden);
    await expect(list({ userId: "o", kind: "operator", channel: "app" })).rejects.toBeInstanceOf(Forbidden);
  });
});
