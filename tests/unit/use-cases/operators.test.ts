import { describe, expect, it } from "vitest";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { adminA, adminB, operator, outsider, setup, superadmin } from "./operators-setup";

const input = { companyId: "c1", name: "Maria", displayName: "Maria Lopez", roleId: "r1", storeIds: ["t1", "t2"] };

describe("makeCreateOperator", () => {
  it("REQ-006 CA-07: returns code.name username and a 6-digit PIN, and assigns the stores", async () => {
    const { create, users, auth } = await setup();
    const r = await create(adminA, input);
    expect(r).toEqual({ userId: "operator-1", username: "abcd.maria", pin: "100001" });
    expect(auth.createOperatorCalls).toEqual([{ username: "abcd.maria", companyId: "c1", displayName: "Maria Lopez" }]);
    expect(await users.listAssignments("operator-1")).toEqual([
      { userId: "operator-1", storeId: "t1", roleId: "r1" },
      { userId: "operator-1", storeId: "t2", roleId: "r1" },
    ]);
  });

  it("normalizes the name (case and spaces) and trims displayName", async () => {
    const { create, auth } = await setup();
    const r = await create(adminA, { ...input, name: "  MARIA ", displayName: "  Maria  " });
    expect(r.username).toBe("abcd.maria");
    expect(auth.createOperatorCalls[0].displayName).toBe("Maria");
  });

  it("superadmin and operator get Forbidden", async () => {
    const { create, auth } = await setup();
    await expect(create(superadmin, input)).rejects.toBeInstanceOf(Forbidden);
    await expect(create(operator, input)).rejects.toBeInstanceOf(Forbidden);
    expect(auth.createOperatorCalls).toEqual([]);
  });

  it("admin without access to the company gets Forbidden", async () => {
    const { create, auth } = await setup();
    await expect(create(outsider, input)).rejects.toBeInstanceOf(Forbidden);
    expect(auth.createOperatorCalls).toEqual([]);
  });

  it.each(["a", "has space", "dot.name", "x".repeat(25), ""])("invalid username %j -> INVALID_USERNAME", async (name) => {
    const { create, auth } = await setup();
    const err = await create(adminA, { ...input, name }).catch((e) => e);
    expect(err).toBeInstanceOf(RuleViolation);
    expect(err.code).toBe("INVALID_USERNAME");
    expect(auth.createOperatorCalls).toEqual([]);
  });

  it.each(["", "   ", "x".repeat(81)])("invalid displayName %j -> INVALID_NAME", async (displayName) => {
    const { create, auth } = await setup();
    const err = await create(adminA, { ...input, displayName }).catch((e) => e);
    expect(err).toBeInstanceOf(RuleViolation);
    expect(err.code).toBe("INVALID_NAME");
    expect(auth.createOperatorCalls).toEqual([]);
  });

  it("duplicate username, including different case, -> NAME_TAKEN", async () => {
    const { create, auth, users } = await setup();
    await create(adminA, input);
    for (const name of ["maria", "MARIA"]) {
      const err = await create(adminA, { ...input, name }).catch((e) => e);
      expect(err).toBeInstanceOf(RuleViolation);
      expect(err.code).toBe("NAME_TAKEN");
    }
    expect(auth.createOperatorCalls).toHaveLength(1);
    expect(users.assignCalls).toHaveLength(1);
  });

  it("a deactivated user still holds its username", async () => {
    const { create, users } = await setup();
    users.profiles.set("old", { id: "old", kind: "operator", username: "abcd.maria", displayName: "x", companyId: "c1", status: "deactivated", mustChangePassword: false });
    const err = await create(adminA, input).catch((e) => e);
    expect(err.code).toBe("NAME_TAKEN");
  });

  it("store of another company -> NotFound; unknown store and empty list too", async () => {
    const { create, auth } = await setup();
    await expect(create(adminA, { ...input, storeIds: ["t1", "t3"] })).rejects.toBeInstanceOf(NotFound);
    await expect(create(adminA, { ...input, storeIds: ["nope"] })).rejects.toBeInstanceOf(NotFound);
    await expect(create(adminA, { ...input, storeIds: [] })).rejects.toBeInstanceOf(NotFound);
    expect(auth.createOperatorCalls).toEqual([]);
  });

  it("role of another administrator or unknown -> Forbidden", async () => {
    const { create, auth } = await setup();
    await expect(create(adminA, { ...input, roleId: "r2" })).rejects.toBeInstanceOf(Forbidden);
    await expect(create(adminA, { ...input, roleId: "nope" })).rejects.toBeInstanceOf(Forbidden);
    expect(auth.createOperatorCalls).toEqual([]);
  });

  it("REQ-007: role excluded for the company -> ROLE_EXCLUDED", async () => {
    const { create, auth } = await setup();
    const err = await create(adminA, { ...input, roleId: "r3" }).catch((e) => e);
    expect(err).toBeInstanceOf(RuleViolation);
    expect(err.code).toBe("ROLE_EXCLUDED");
    expect(auth.createOperatorCalls).toEqual([]);
  });
});

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
    const { assign } = await setup();
    await expect(assign(adminA, { ...a, userId: "adm" })).rejects.toBeInstanceOf(NotFound);
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
    const { changeRole } = await setup();
    await expect(changeRole(adminA, { userId: "u1", storeId: "t2", roleId: "r1" })).rejects.toBeInstanceOf(NotFound);
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
    const { changeRole } = await setup();
    await expect(changeRole(adminA, { userId: "adm", storeId: null, roleId: "r1" })).rejects.toBeInstanceOf(NotFound);
  });
});
