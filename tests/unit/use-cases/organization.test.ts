import { describe, expect, it } from "vitest";
import { makeCreateCompany } from "@/core/application/use-cases/organization/create-company";
import { makeCreateSite } from "@/core/application/use-cases/organization/create-site";
import { makeCreateStore } from "@/core/application/use-cases/organization/create-store";
import { makeDeactivateUnit } from "@/core/application/use-cases/organization/deactivate-unit";
import { makeDeleteUnit } from "@/core/application/use-cases/organization/delete-unit";
import { makeGrantCompanyAccess } from "@/core/application/use-cases/organization/grant-company-access";
import { makeListCompanies } from "@/core/application/use-cases/organization/list-companies";
import { makeReactivateUnit } from "@/core/application/use-cases/organization/reactivate-unit";
import { makeRevokeCompanyAccess } from "@/core/application/use-cases/organization/revoke-company-access";
import { makeUpdateCompanySettings } from "@/core/application/use-cases/organization/update-company-settings";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { InMemoryOrganization } from "../../fakes/in-memory-organization";
import { InMemoryUserRepository } from "../../fakes/in-memory-user-repository";

const act = (userId: string, kind: Actor["kind"]): Actor => ({ userId, kind, channel: "ui" });
const founder = act("f1", "admin");
const other = act("a2", "admin");
const stranger = act("a3", "admin");
const superadmin = act("sa", "superadmin");
const operator = act("op", "operator");

function setup() {
  const org = new InMemoryOrganization();
  const users = new InMemoryUserRepository();
  for (const [id, kind] of [["f1", "admin"], ["a2", "admin"], ["a3", "admin"], ["op", "operator"]] as const) {
    users.profiles.set(id, { id, kind, username: null, displayName: id, companyId: null, status: "active", mustChangePassword: false });
  }
  org.seedCompany("c1", "f1", ["a2"]);
  org.seedCompany("c2", "a3");
  org.seedSite("s1", "c1");
  org.seedSite("s2", "c2");
  org.seedStore("t1", "c1", "s1");
  const companies = org.companyRepo;
  return {
    org,
    createCompany: makeCreateCompany({ companies }),
    listCompanies: makeListCompanies({ companies }),
    grant: makeGrantCompanyAccess({ companies, users }),
    revoke: makeRevokeCompanyAccess({ companies }),
    update: makeUpdateCompanySettings({ companies }),
    createSite: makeCreateSite({ companies, sites: org.siteRepo }),
    createStore: makeCreateStore({ companies, sites: org.siteRepo, stores: org.storeRepo }),
    deactivate: makeDeactivateUnit({ units: org.unitRepo, companies }),
    reactivate: makeReactivateUnit({ units: org.unitRepo, companies }),
    del: makeDeleteUnit({ units: org.unitRepo, companies }),
  };
}

const rule = (code: string) => expect.objectContaining({ name: "RuleViolation", code });

describe("createCompany", () => {
  it("REQ-005 CA-01: admin creates a company, becomes founder, gets a 4-char code", async () => {
    const { org, createCompany } = setup();
    const c = await createCompany(act("n1", "admin"), { name: "Acme" });
    expect(c.founderId).toBe("n1");
    expect(c.code).toBe("abcd");
    expect(c.name).toBe("Acme");
    expect(org.admins.get(c.id)).toEqual(new Set(["n1"]));
  });
  it("REQ-005 CA-01: operator and superadmin get Forbidden and nothing is created", async () => {
    const { org, createCompany } = setup();
    for (const a of [operator, superadmin]) {
      expect(await createCompany(a, { name: "X" }).catch((e) => e)).toBeInstanceOf(Forbidden);
    }
    expect(org.companies.size).toBe(2);
  });
});

describe("listCompanies", () => {
  it("REQ-005 CA-11: an admin only sees his companies", async () => {
    const { listCompanies } = setup();
    expect((await listCompanies(founder)).map((c) => c.id)).toEqual(["c1"]);
    expect((await listCompanies(stranger)).map((c) => c.id)).toEqual(["c2"]);
    expect((await listCompanies(superadmin)).map((c) => c.id)).toEqual(["c1", "c2"]);
  });
  it("operator gets Forbidden", async () => {
    const { listCompanies } = setup();
    expect(await listCompanies(operator).catch((e) => e)).toBeInstanceOf(Forbidden);
  });
});

describe("createSite / createStore", () => {
  it("REQ-005 CA-02: admin with access creates a site and a store inside it", async () => {
    const { createSite, createStore } = setup();
    const site = await createSite(founder, { companyId: "c1", name: "Norte" });
    expect(site).toMatchObject({ companyId: "c1", name: "Norte" });
    const store = await createStore(other, { companyId: "c1", siteId: site.id, name: "Local" });
    expect(store).toMatchObject({ companyId: "c1", siteId: site.id, name: "Local" });
  });
  it("REQ-005 CA-02: a store whose site belongs to another company is NotFound", async () => {
    const { org, createStore } = setup();
    const error = await createStore(founder, { companyId: "c1", siteId: "s2", name: "X" }).catch((e) => e);
    expect(error).toBeInstanceOf(NotFound);
    expect(org.stores.size).toBe(1);
  });
  it("missing company or site is NotFound", async () => {
    const { createSite, createStore } = setup();
    expect(await createSite(founder, { companyId: "zz", name: "X" }).catch((e) => e)).toBeInstanceOf(NotFound);
    expect(await createStore(founder, { companyId: "c1", siteId: "zz", name: "X" }).catch((e) => e)).toBeInstanceOf(NotFound);
  });
  it("REQ-005 CA-11: superadmin, operator and admin without access get Forbidden", async () => {
    const { org, createSite, createStore } = setup();
    for (const a of [superadmin, operator, stranger]) {
      expect(await createSite(a, { companyId: "c1", name: "X" }).catch((e) => e)).toBeInstanceOf(Forbidden);
      expect(await createStore(a, { companyId: "c1", siteId: "s1", name: "X" }).catch((e) => e)).toBeInstanceOf(Forbidden);
    }
    expect(org.sites.size).toBe(2);
    expect(org.stores.size).toBe(1);
  });
});

describe("grantCompanyAccess", () => {
  it("REQ-005 CA-03: any admin of the company grants access to another admin", async () => {
    const { org, grant } = setup();
    await grant(other, { companyId: "c1", adminId: "a3" });
    expect(org.admins.get("c1")).toEqual(new Set(["f1", "a2", "a3"]));
  });
  it("REQ-005 CA-03: superadmin grants access", async () => {
    const { org, grant } = setup();
    await grant(superadmin, { companyId: "c1", adminId: "a3" });
    expect(org.admins.get("c1")?.has("a3")).toBe(true);
  });
  it("REQ-005 CA-03: an admin outside the company, or an operator, gets Forbidden", async () => {
    const { org, grant } = setup();
    for (const a of [stranger, operator]) {
      expect(await grant(a, { companyId: "c1", adminId: "a3" }).catch((e) => e)).toBeInstanceOf(Forbidden);
    }
    expect(org.admins.get("c1")).toEqual(new Set(["f1", "a2"]));
  });
  it("REQ-005 CA-03: the target must be an existing admin", async () => {
    const { org, grant } = setup();
    for (const target of ["op", "ghost"]) {
      expect(await grant(founder, { companyId: "c1", adminId: target }).catch((e) => e)).toBeInstanceOf(NotFound);
    }
    expect(org.admins.get("c1")).toEqual(new Set(["f1", "a2"]));
  });
});

describe("revokeCompanyAccess", () => {
  it("REQ-005 CA-04: founder and superadmin can revoke another admin", async () => {
    const { org, revoke, grant } = setup();
    await revoke(founder, { companyId: "c1", adminId: "a2" });
    expect(org.admins.get("c1")).toEqual(new Set(["f1"]));
    await grant(founder, { companyId: "c1", adminId: "a2" });
    await revoke(superadmin, { companyId: "c1", adminId: "a2" });
    expect(org.admins.get("c1")).toEqual(new Set(["f1"]));
  });
  it("REQ-005 CA-04: a non-founder admin gets Forbidden", async () => {
    const { org, revoke } = setup();
    for (const a of [other, stranger, operator]) {
      expect(await revoke(a, { companyId: "c1", adminId: "a2" }).catch((e) => e)).toBeInstanceOf(Forbidden);
    }
    expect(org.admins.get("c1")).toEqual(new Set(["f1", "a2"]));
  });
  it("REQ-005 CA-05: revoking the founder throws FOUNDER_PROTECTED, even by superadmin or himself", async () => {
    const { org, revoke } = setup();
    for (const a of [superadmin, founder]) {
      const error = await revoke(a, { companyId: "c1", adminId: "f1" }).catch((e) => e);
      expect(error).toBeInstanceOf(RuleViolation);
      expect(error).toEqual(rule("FOUNDER_PROTECTED"));
    }
    expect(org.admins.get("c1")).toEqual(new Set(["f1", "a2"]));
  });
  it("unknown company is NotFound", async () => {
    const { revoke } = setup();
    expect(await revoke(superadmin, { companyId: "zz", adminId: "a2" }).catch((e) => e)).toBeInstanceOf(NotFound);
  });
});

describe("updateCompanySettings", () => {
  it("REQ-005 CA-10: 3600 is saved", async () => {
    const { org, update } = setup();
    await update(founder, { companyId: "c1", sessionCapSeconds: 3600 });
    expect(org.companies.get("c1")?.sessionCapSeconds).toBe(3600);
  });
  it("REQ-005 CA-10: 86400 is saved, 86401 throws SESSION_TOO_LONG", async () => {
    const { org, update } = setup();
    await update(other, { companyId: "c1", sessionCapSeconds: 86400 });
    expect(org.companies.get("c1")?.sessionCapSeconds).toBe(86400);
    const error = await update(other, { companyId: "c1", sessionCapSeconds: 86401 }).catch((e) => e);
    expect(error).toEqual(rule("SESSION_TOO_LONG"));
    expect(org.companies.get("c1")?.sessionCapSeconds).toBe(86400);
  });
  it.each([0, -5, 1.5, Number.NaN, Number.POSITIVE_INFINITY])("%s throws INVALID_SESSION_SECONDS", async (n) => {
    const { org, update } = setup();
    const error = await update(founder, { companyId: "c1", sessionCapSeconds: n }).catch((e) => e);
    expect(error).toEqual(rule("INVALID_SESSION_SECONDS"));
    expect(org.companies.get("c1")?.sessionCapSeconds).toBe(28800);
  });
  it("REQ-005 CA-10: superadmin, operator and admin without access get Forbidden", async () => {
    const { org, update } = setup();
    for (const a of [superadmin, operator, stranger]) {
      expect(await update(a, { companyId: "c1", sessionCapSeconds: 3600 }).catch((e) => e)).toBeInstanceOf(Forbidden);
    }
    expect(org.companies.get("c1")?.sessionCapSeconds).toBe(28800);
  });
});

describe("deactivate / reactivate / delete unit", () => {
  it("REQ-005 CA-08: founder deactivates a site with a reason", async () => {
    const { org, deactivate } = setup();
    await deactivate(founder, { level: "site", id: "s1", reason: { code: "cierre-temporal" } });
    expect(org.sites.get("s1")?.status).toBe("inactive");
    expect(org.reasons.get("site:s1")).toEqual({ code: "cierre-temporal" });
  });
  it("REQ-005 CA-08: superadmin deactivates a company", async () => {
    const { org, deactivate } = setup();
    await deactivate(superadmin, { level: "company", id: "c1", reason: { code: "otro", text: "x" } });
    expect(org.companies.get("c1")?.status).toBe("inactive");
  });
  it("REQ-005 CA-07: non-founder admin, stranger and operator get Forbidden", async () => {
    const { org, deactivate } = setup();
    for (const a of [other, stranger, operator]) {
      const error = await deactivate(a, { level: "store", id: "t1", reason: { code: "cierre-definitivo" } }).catch((e) => e);
      expect(error).toBeInstanceOf(Forbidden);
    }
    expect(org.stores.get("t1")?.status).toBe("active");
  });
  it("REQ-005 CA-08: missing reason, or otro without text, throws REASON_REQUIRED", async () => {
    const { org, deactivate } = setup();
    for (const reason of [undefined, { code: "otro" as const }, { code: "otro" as const, text: "  " }]) {
      const error = await deactivate(founder, { level: "store", id: "t1", reason: reason as never }).catch((e) => e);
      expect(error).toEqual(rule("REASON_REQUIRED"));
    }
    expect(org.stores.get("t1")?.status).toBe("active");
    expect(org.reasons.size).toBe(0);
  });
  it("unknown unit is NotFound", async () => {
    const { deactivate, reactivate, del } = setup();
    expect(await deactivate(founder, { level: "site", id: "zz", reason: { code: "cierre-definitivo" } }).catch((e) => e)).toBeInstanceOf(NotFound);
    expect(await reactivate(founder, { level: "site", id: "zz", text: "ok" }).catch((e) => e)).toBeInstanceOf(NotFound);
    expect(await del(founder, { level: "site", id: "zz" }).catch((e) => e)).toBeInstanceOf(NotFound);
  });
  it("REQ-005 CA-12: reactivation needs free text and stores it as otro", async () => {
    const { org, deactivate, reactivate } = setup();
    await deactivate(founder, { level: "store", id: "t1", reason: { code: "remodelacion" } });
    for (const text of ["", "   "]) {
      expect(await reactivate(founder, { level: "store", id: "t1", text }).catch((e) => e)).toEqual(rule("REASON_REQUIRED"));
    }
    expect(org.stores.get("t1")?.status).toBe("inactive");
    await reactivate(superadmin, { level: "store", id: "t1", text: "Terminó la obra" });
    expect(org.stores.get("t1")?.status).toBe("active");
    expect(org.reasons.get("store:t1")).toEqual({ code: "otro", text: "Terminó la obra" });
  });
  it("REQ-005 CA-12: others cannot reactivate", async () => {
    const { org, deactivate, reactivate } = setup();
    await deactivate(founder, { level: "store", id: "t1", reason: { code: "remodelacion" } });
    for (const a of [other, stranger, operator]) {
      expect(await reactivate(a, { level: "store", id: "t1", text: "ok" }).catch((e) => e)).toBeInstanceOf(Forbidden);
    }
    expect(org.stores.get("t1")?.status).toBe("inactive");
  });
  it("REQ-005 CA-06: delete with data throws HAS_DATA and does not delete", async () => {
    const { org, del } = setup();
    org.withData.add("site:s1");
    expect(await del(founder, { level: "site", id: "s1" }).catch((e) => e)).toEqual(rule("HAS_DATA"));
    expect(org.deleted.size).toBe(0);
  });
  it("REQ-005 CA-14: delete without data is a soft delete by founder or superadmin", async () => {
    const { org, del } = setup();
    await del(founder, { level: "site", id: "s1" });
    await del(superadmin, { level: "store", id: "t1" });
    expect(org.deleted).toEqual(new Set(["site:s1", "store:t1"]));
  });
  it("REQ-005 CA-07: delete by others is Forbidden", async () => {
    const { org, del } = setup();
    for (const a of [other, stranger, operator]) {
      expect(await del(a, { level: "site", id: "s1" }).catch((e) => e)).toBeInstanceOf(Forbidden);
    }
    expect(org.deleted.size).toBe(0);
  });
});
