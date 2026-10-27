import { describe, expect, it } from "vitest";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { adminA, adminB, operator, outsider, setup, superadmin } from "./operators-setup";

describe("makeAssignStores", () => {
  const a = { userId: "u1", assignments: [{ storeId: "t2", roleId: "r1" }] };

  it("REQ-006 CA-09: replaces the assignments", async () => {
    const { assign, users } = await setup();
    await assign(adminA, a);
    expect(await users.listAssignments("u1")).toEqual([{ userId: "u1", storeId: "t2", roleId: "r1" }]);
  });

  it("superadmin and operator get Forbidden", async () => {
    const { assign, users } = await setup();
    await expect(assign(superadmin, a)).rejects.toBeInstanceOf(Forbidden);
    await expect(assign(operator, a)).rejects.toBeInstanceOf(Forbidden);
    expect(users.assignCalls).toEqual([]);
  });

  it("admin without access, user of another company, orphan or missing user -> Forbidden", async () => {
    const { assign, users } = await setup();
    await expect(assign(outsider, a)).rejects.toBeInstanceOf(Forbidden);
    await expect(assign(adminA, { ...a, userId: "u2" })).rejects.toBeInstanceOf(Forbidden);
    await expect(assign(adminA, { ...a, userId: "orphan" })).rejects.toBeInstanceOf(Forbidden);
    await expect(assign(adminA, { ...a, userId: "ghost" })).rejects.toBeInstanceOf(Forbidden);
    expect(users.assignCalls).toEqual([]);
  });

  it("target that is not an operator -> NotFound", async () => {
    const { assign, users } = await setup();
    await expect(assign(adminA, { ...a, userId: "adm" })).rejects.toBeInstanceOf(NotFound);
    expect(users.assignCalls).toEqual([]);
  });

  it("role of another admin -> Forbidden; excluded -> ROLE_EXCLUDED; foreign store -> NotFound", async () => {
    const { assign, users } = await setup();
    await expect(assign(adminA, { userId: "u1", assignments: [{ storeId: "t1", roleId: "r2" }] })).rejects.toBeInstanceOf(Forbidden);
    const err = await assign(adminA, { userId: "u1", assignments: [{ storeId: "t1", roleId: "r3" }] }).catch((e) => e);
    expect(err).toBeInstanceOf(RuleViolation);
    expect(err.code).toBe("ROLE_EXCLUDED");
    await expect(assign(adminA, { userId: "u1", assignments: [{ storeId: "t3", roleId: "r1" }] })).rejects.toBeInstanceOf(NotFound);
    expect(users.assignCalls).toEqual([]);
  });
});

describe("makeAssignStores (current assignments, duplicates, deactivated)", () => {
  it("REQ-007 CA-11: non-owner admin cannot replace or wipe assignments of another admin's role", async () => {
    const { assign, users } = await setup();
    await expect(assign(adminB, { userId: "u1", assignments: [{ storeId: "t2", roleId: "r2" }] })).rejects.toBeInstanceOf(Forbidden);
    await expect(assign(adminB, { userId: "u1", assignments: [] })).rejects.toBeInstanceOf(Forbidden);
    expect(users.assignCalls).toEqual([]);
    expect(await users.listAssignments("u1")).toEqual([{ userId: "u1", storeId: "t1", roleId: "r1" }]);
  });

  it("the owner may assign an empty list", async () => {
    const { assign, users } = await setup();
    await assign(adminA, { userId: "u1", assignments: [] });
    expect(await users.listAssignments("u1")).toEqual([]);
  });

  it("a repeated storeId: the last occurrence wins", async () => {
    const { assign, users } = await setup();
    await assign(adminA, {
      userId: "u1",
      assignments: [{ storeId: "t1", roleId: "r1" }, { storeId: "t2", roleId: "r1" }, { storeId: "t1", roleId: "r4" }],
    });
    expect(await users.listAssignments("u1")).toEqual([
      { userId: "u1", storeId: "t1", roleId: "r4" },
      { userId: "u1", storeId: "t2", roleId: "r1" },
    ]);
  });

  it("deactivated target -> NotFound, no mutation", async () => {
    const { assign, users } = await setup();
    await expect(assign(adminA, { userId: "u4", assignments: [] })).rejects.toBeInstanceOf(NotFound);
    expect(users.assignCalls).toEqual([]);
  });
});

describe("makeChangeOperatorRole", () => {
  it("REQ-006 CA-09: the role owner changes the role of one store", async () => {
    const { changeRole, users } = await setup();
    await users.assignStores("u1", [{ storeId: "t1", roleId: "r1" }, { storeId: "t2", roleId: "r1" }]);
    await changeRole(adminA, { userId: "u1", storeId: "t2", roleId: "r4" });
    expect(await users.listAssignments("u1")).toEqual([
      { userId: "u1", storeId: "t1", roleId: "r1" },
      { userId: "u1", storeId: "t2", roleId: "r4" },
    ]);
  });

  it("changes all stores when storeId is null", async () => {
    const { changeRole, users } = await setup();
    await users.assignStores("u1", [{ storeId: "t1", roleId: "r1" }, { storeId: "t2", roleId: "r1" }]);
    await changeRole(adminA, { userId: "u1", storeId: null, roleId: "r4" });
    expect(await users.listAssignments("u1")).toEqual([
      { userId: "u1", storeId: "t1", roleId: "r4" },
      { userId: "u1", storeId: "t2", roleId: "r4" },
    ]);
  });

  it("REQ-007 CA-11: a non-owner admin cannot change a role owned by another admin", async () => {
    const { changeRole, users } = await setup();
    await expect(changeRole(adminB, { userId: "u1", storeId: "t1", roleId: "r2" })).rejects.toBeInstanceOf(Forbidden);
    await expect(changeRole(adminB, { userId: "u1", storeId: null, roleId: "r2" })).rejects.toBeInstanceOf(Forbidden);
    expect(users.assignCalls).toEqual([]);
    expect(await users.listAssignments("u1")).toEqual([{ userId: "u1", storeId: "t1", roleId: "r1" }]);
  });

  it("the owner can move the user to the new role only if it owns it", async () => {
    const { changeRole, users } = await setup();
    await expect(changeRole(adminA, { userId: "u1", storeId: "t1", roleId: "r2" })).rejects.toBeInstanceOf(Forbidden);
    expect(users.assignCalls).toEqual([]);
  });

  it("excluded new role -> ROLE_EXCLUDED", async () => {
    const { changeRole, users } = await setup();
    const err = await changeRole(adminA, { userId: "u1", storeId: "t1", roleId: "r3" }).catch((e) => e);
    expect(err).toBeInstanceOf(RuleViolation);
    expect(err.code).toBe("ROLE_EXCLUDED");
    expect(users.assignCalls).toEqual([]);
  });

  it("store without assignment -> NotFound", async () => {
    const { changeRole, users } = await setup();
    await expect(changeRole(adminA, { userId: "u1", storeId: "t2", roleId: "r1" })).rejects.toBeInstanceOf(NotFound);
    expect(users.assignCalls).toEqual([]);
  });

  it("superadmin, operator and admin without company access get Forbidden", async () => {
    const { changeRole, users } = await setup();
    const i = { userId: "u1", storeId: "t1", roleId: "r1" };
    await expect(changeRole(superadmin, i)).rejects.toBeInstanceOf(Forbidden);
    await expect(changeRole(operator, i)).rejects.toBeInstanceOf(Forbidden);
    await expect(changeRole(outsider, i)).rejects.toBeInstanceOf(Forbidden);
    expect(users.assignCalls).toEqual([]);
  });

  it("non-operator target -> NotFound", async () => {
    const { changeRole, users } = await setup();
    await expect(changeRole(adminA, { userId: "adm", storeId: null, roleId: "r1" })).rejects.toBeInstanceOf(NotFound);
    await expect(changeRole(adminA, { userId: "u4", storeId: null, roleId: "r1" })).rejects.toBeInstanceOf(NotFound);
    expect(users.assignCalls).toEqual([]);
  });

  it("storeId null over mixed-owner assignments -> Forbidden, no mutation", async () => {
    const { changeRole, users } = await setup();
    await users.assignStores("u1", [{ storeId: "t1", roleId: "r1" }, { storeId: "t2", roleId: "r2" }]);
    users.assignCalls.length = 0;
    await expect(changeRole(adminA, { userId: "u1", storeId: null, roleId: "r4" })).rejects.toBeInstanceOf(Forbidden);
    expect(users.assignCalls).toEqual([]);
  });
});
