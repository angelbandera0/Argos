import { describe, expect, it } from "vitest";
import { makeCreateRole } from "@/core/application/use-cases/roles/create-role";
import { makeDeleteRole } from "@/core/application/use-cases/roles/delete-role";
import { makeListRoles } from "@/core/application/use-cases/roles/list-roles";
import { makeSetRoleCompanyExclusions } from "@/core/application/use-cases/roles/set-role-company-exclusions";
import { makeUpdateRole } from "@/core/application/use-cases/roles/update-role";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, RuleViolation } from "@/core/domain/errors";
import type { PermissionSet } from "@/core/domain/permissions";
import { InMemoryOrganization } from "../../fakes/in-memory-organization";
import { InMemoryRoles } from "../../fakes/in-memory-roles";

const act = (userId: string, kind: Actor["kind"]): Actor => ({ userId, kind, channel: "ui" });
const admin = act("a1", "admin");
const otherAdmin = act("a2", "admin");
const superadmin = act("sa", "superadmin");
const operator = act("op", "operator");

const none: PermissionSet = { view: false, create: false, edit: false, delete: false };
const viewOnly: PermissionSet = { view: true, create: false, edit: false, delete: false };
const full: PermissionSet = { view: true, create: true, edit: true, delete: true };

function setup() {
  const org = new InMemoryOrganization();
  org.seedCompany("c1", "a1");
  org.seedCompany("c2", "a1");
  org.seedCompany("c3", "a2");
  const roles = new InMemoryRoles();
  const companies = org.companyRepo;
  return {
    roles,
    create: makeCreateRole({ roles, companies }),
    update: makeUpdateRole({ roles, companies }),
    setExclusions: makeSetRoleCompanyExclusions({ roles, companies }),
    del: makeDeleteRole({ roles }),
    list: makeListRoles({ roles }),
  };
}

const base = { name: "Cajero", sessionSeconds: null, permissions: { products: viewOnly } };

describe("makeCreateRole", () => {
  it("CA-01: admin creates a role with permissions over products", async () => {
    const { create, roles } = setup();
    const role = await create(admin, { ...base, permissions: { products: full } });
    expect(role).toEqual({
      id: "r1",
      ownerId: "a1",
      name: "Cajero",
      sessionSeconds: null,
      excludedCompanyIds: [],
      permissions: { products: full },
    });
    expect(await roles.getById("r1")).toEqual(role);
  });

  it("CA-01: operator and superadmin get Forbidden", async () => {
    const { create, roles } = setup();
    await expect(create(operator, base)).rejects.toBeInstanceOf(Forbidden);
    await expect(create(superadmin, base)).rejects.toBeInstanceOf(Forbidden);
    expect(roles.roles.size).toBe(0);
  });

  it("CA-02/03: stores excludedCompanyIds; default is empty (valid for all companies)", async () => {
    const { create } = setup();
    const withExcl = await create(admin, { ...base, excludedCompanyIds: ["c2"] });
    expect(withExcl.excludedCompanyIds).toEqual(["c2"]);
    const without = await create(admin, { ...base, name: "Otro" });
    expect(without.excludedCompanyIds).toEqual([]);
  });

  it("excluding a company the admin has no access to is Forbidden", async () => {
    const { create, roles } = setup();
    await expect(create(admin, { ...base, excludedCompanyIds: ["c3"] })).rejects.toBeInstanceOf(Forbidden);
    await expect(create(admin, { ...base, excludedCompanyIds: ["nope"] })).rejects.toBeInstanceOf(Forbidden);
    expect(roles.roles.size).toBe(0);
  });

  it("CA-06: sessionSeconds 86401 is SESSION_TOO_LONG; 86400 is accepted", async () => {
    const { create, roles } = setup();
    await expect(create(admin, { ...base, sessionSeconds: 86401 })).rejects.toMatchObject({
      name: "RuleViolation",
      code: "SESSION_TOO_LONG",
    });
    expect(roles.roles.size).toBe(0);
    expect((await create(admin, { ...base, sessionSeconds: 86400 })).sessionSeconds).toBe(86400);
  });

  it.each([0, -5, 1.5, Number.NaN, Number.POSITIVE_INFINITY])("sessionSeconds %s is INVALID_SESSION_SECONDS", async (s) => {
    const { create, roles } = setup();
    const err = await create(admin, { ...base, sessionSeconds: s }).catch((e) => e);
    expect(err).toBeInstanceOf(RuleViolation);
    expect(err.code).toBe("INVALID_SESSION_SECONDS");
    expect(roles.roles.size).toBe(0);
  });

  it("create/edit/delete without view is PERMISSION_REQUIRES_VIEW", async () => {
    const { create, roles } = setup();
    for (const p of [{ ...none, create: true }, { ...none, edit: true }, { ...none, delete: true }]) {
      const err = await create(admin, { ...base, permissions: { products: p } }).catch((e) => e);
      expect(err).toBeInstanceOf(RuleViolation);
      expect(err.code).toBe("PERMISSION_REQUIRES_VIEW");
    }
    expect(roles.roles.size).toBe(0);
  });

  it("CA-05: no permission exists for management modules (compile-time)", async () => {
    const { create } = setup();
    const p = async () =>
      create(admin, {
        ...base,
        // @ts-expect-error "users" is not a Module
        permissions: { products: viewOnly, users: viewOnly },
      });
    expect(typeof p).toBe("function");
  });

  it("names are trimmed and must be 1..80 chars", async () => {
    const { create, roles } = setup();
    expect((await create(admin, { ...base, name: "  Cajero  " })).name).toBe("Cajero");
    for (const name of ["", "   ", "x".repeat(81)]) {
      const err = await create(admin, { ...base, name }).catch((e) => e);
      expect(err).toBeInstanceOf(RuleViolation);
      expect(err.code).toBe("INVALID_NAME");
    }
    expect(roles.roles.size).toBe(1);
    expect((await create(admin, { ...base, name: "y".repeat(80) })).name).toHaveLength(80);
  });

  it("duplicate name for the same owner is NAME_TAKEN ignoring case and spaces", async () => {
    const { create, roles } = setup();
    await create(admin, base);
    for (const name of ["Cajero", " cajero ", "CAJERO"]) {
      const err = await create(admin, { ...base, name }).catch((e) => e);
      expect(err).toBeInstanceOf(RuleViolation);
      expect(err.code).toBe("NAME_TAKEN");
    }
    expect(roles.roles.size).toBe(1);
  });

  it("another admin may reuse the name; a deleted role frees it", async () => {
    const { create, del } = setup();
    const mine = await create(admin, base);
    expect((await create(otherAdmin, base)).ownerId).toBe("a2");
    await del(admin, mine.id);
    expect((await create(admin, base)).name).toBe("Cajero");
  });
});

describe("makeUpdateRole", () => {
  it("updates only the patched fields", async () => {
    const { create, update } = setup();
    const r = await create(admin, base);
    const updated = await update(admin, r.id, { sessionSeconds: 3600, permissions: { products: full } });
    expect(updated).toEqual({ ...r, sessionSeconds: 3600, permissions: { products: full } });
  });

  it("renaming to its own name (different case) is allowed; to another's is NAME_TAKEN", async () => {
    const { create, update, roles } = setup();
    const r = await create(admin, base);
    await create(admin, { ...base, name: "Gerente" });
    expect((await update(admin, r.id, { name: " CAJERO " })).name).toBe("CAJERO");
    const err = await update(admin, r.id, { name: "gerente" }).catch((e) => e);
    expect(err.code).toBe("NAME_TAKEN");
    expect((await roles.getById(r.id))?.name).toBe("CAJERO");
  });

  it("validates patch values and leaves the role unchanged", async () => {
    const { create, update, roles } = setup();
    const r = await create(admin, base);
    const bad = [
      [{ name: "" }, "INVALID_NAME"],
      [{ sessionSeconds: 86401 }, "SESSION_TOO_LONG"],
      [{ sessionSeconds: 0 }, "INVALID_SESSION_SECONDS"],
      [{ permissions: { products: { ...none, edit: true } } }, "PERMISSION_REQUIRES_VIEW"],
    ] as const;
    for (const [patch, code] of bad) {
      const err = await update(admin, r.id, patch).catch((e) => e);
      expect(err).toBeInstanceOf(RuleViolation);
      expect(err.code).toBe(code);
    }
    expect(await roles.getById(r.id)).toEqual(r);
  });

  it("excludedCompanyIds in patch must be accessible companies", async () => {
    const { create, update, roles } = setup();
    const r = await create(admin, base);
    await expect(update(admin, r.id, { excludedCompanyIds: ["c3"] })).rejects.toBeInstanceOf(Forbidden);
    expect((await roles.getById(r.id))?.excludedCompanyIds).toEqual([]);
    expect((await update(admin, r.id, { excludedCompanyIds: ["c1"] })).excludedCompanyIds).toEqual(["c1"]);
  });

  it("CA-10: another admin's or missing role is Forbidden; operator and superadmin too", async () => {
    const { create, update, roles } = setup();
    const r = await create(admin, base);
    await expect(update(otherAdmin, r.id, { name: "X" })).rejects.toBeInstanceOf(Forbidden);
    await expect(update(admin, "missing", { name: "X" })).rejects.toBeInstanceOf(Forbidden);
    await expect(update(operator, r.id, { name: "X" })).rejects.toBeInstanceOf(Forbidden);
    await expect(update(superadmin, r.id, { name: "X" })).rejects.toBeInstanceOf(Forbidden);
    expect(await roles.getById(r.id)).toEqual(r);
  });
});

describe("makeSetRoleCompanyExclusions", () => {
  it("replaces the exclusions", async () => {
    const { create, setExclusions } = setup();
    const r = await create(admin, { ...base, excludedCompanyIds: ["c1"] });
    const updated = await setExclusions(admin, { roleId: r.id, companyIds: ["c2"] });
    expect(updated.excludedCompanyIds).toEqual(["c2"]);
    expect((await setExclusions(admin, { roleId: r.id, companyIds: [] })).excludedCompanyIds).toEqual([]);
  });

  it("keeps exclusions on companies the actor cannot see; cannot touch them", async () => {
    const { create, update, setExclusions, roles } = setup();
    const r = await create(admin, { ...base, excludedCompanyIds: ["c1"] });
    await roles.update(r.id, { excludedCompanyIds: ["c1", "hidden"] });
    expect((await setExclusions(admin, { roleId: r.id, companyIds: ["c2"] })).excludedCompanyIds.sort()).toEqual(["c2", "hidden"]);
    expect((await update(admin, r.id, { excludedCompanyIds: [] })).excludedCompanyIds).toEqual(["hidden"]);
    await expect(setExclusions(admin, { roleId: r.id, companyIds: ["hidden"] })).rejects.toBeInstanceOf(Forbidden);
    await expect(update(admin, r.id, { excludedCompanyIds: ["hidden"] })).rejects.toBeInstanceOf(Forbidden);
    expect((await roles.getById(r.id))?.excludedCompanyIds).toEqual(["hidden"]);
  });

  it("inaccessible company, foreign or missing role, non-admin -> Forbidden, no mutation", async () => {
    const { create, setExclusions, roles } = setup();
    const r = await create(admin, base);
    await expect(setExclusions(admin, { roleId: r.id, companyIds: ["c3"] })).rejects.toBeInstanceOf(Forbidden);
    await expect(setExclusions(otherAdmin, { roleId: r.id, companyIds: ["c3"] })).rejects.toBeInstanceOf(Forbidden);
    await expect(setExclusions(admin, { roleId: "missing", companyIds: [] })).rejects.toBeInstanceOf(Forbidden);
    await expect(setExclusions(operator, { roleId: r.id, companyIds: [] })).rejects.toBeInstanceOf(Forbidden);
    await expect(setExclusions(superadmin, { roleId: r.id, companyIds: [] })).rejects.toBeInstanceOf(Forbidden);
    expect(await roles.getById(r.id)).toEqual(r);
  });
});

describe("makeDeleteRole", () => {
  it("owner soft-deletes an unassigned role", async () => {
    const { create, del, roles } = setup();
    const r = await create(admin, base);
    await del(admin, r.id);
    expect(await roles.getById(r.id)).toBeNull();
    expect(roles.deleted.has(r.id)).toBe(true);
  });

  it("role with assignments is HAS_DATA and not deleted", async () => {
    const { create, del, roles } = setup();
    const r = await create(admin, base);
    roles.markAssigned(r.id);
    const err = await del(admin, r.id).catch((e) => e);
    expect(err).toBeInstanceOf(RuleViolation);
    expect(err.code).toBe("HAS_DATA");
    expect(await roles.getById(r.id)).toEqual(r);
  });

  it("CA-10: foreign or missing role, operator, superadmin -> Forbidden", async () => {
    const { create, del, roles } = setup();
    const r = await create(admin, base);
    await expect(del(otherAdmin, r.id)).rejects.toBeInstanceOf(Forbidden);
    await expect(del(admin, "missing")).rejects.toBeInstanceOf(Forbidden);
    await expect(del(operator, r.id)).rejects.toBeInstanceOf(Forbidden);
    await expect(del(superadmin, r.id)).rejects.toBeInstanceOf(Forbidden);
    expect(await roles.getById(r.id)).toEqual(r);
  });
});

describe("makeListRoles", () => {
  it("CA-10: returns only the actor's live roles", async () => {
    const { create, list, del } = setup();
    const a = await create(admin, base);
    const gone = await create(admin, { ...base, name: "Borrar" });
    await create(otherAdmin, { ...base, name: "Ajeno" });
    await del(admin, gone.id);
    expect(await list(admin)).toEqual([a]);
    expect((await list(otherAdmin)).map((r) => r.name)).toEqual(["Ajeno"]);
  });

  it("operator and superadmin get Forbidden", async () => {
    const { list } = setup();
    await expect(list(operator)).rejects.toBeInstanceOf(Forbidden);
    await expect(list(superadmin)).rejects.toBeInstanceOf(Forbidden);
  });
});
