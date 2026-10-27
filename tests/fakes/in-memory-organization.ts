import type { Company, CompanyRepository, Level } from "@/core/application/ports/company-repository";
import type { Site, SiteRepository } from "@/core/application/ports/site-repository";
import type { Store, StoreRepository } from "@/core/application/ports/store-repository";
import type { UnitStatusRepository } from "@/core/application/ports/unit-status-repository";
import type { Actor } from "@/core/domain/actor";
import { generateCompanyCode } from "@/core/domain/company-code";
import type { Reason } from "@/core/domain/deactivation";

export class InMemoryOrganization {
  readonly companies = new Map<string, Company>();
  readonly sites = new Map<string, Site>();
  readonly stores = new Map<string, Store>();
  readonly admins = new Map<string, Set<string>>();
  readonly reasons = new Map<string, Reason | null>();
  readonly deleted = new Set<string>();
  readonly withData = new Set<string>();
  private seq = 0;
  private counter = 0;

  nextId(prefix: string): string {
    this.seq += 1;
    return `${prefix}${this.seq}`;
  }

  nextCounter(): number {
    return this.counter++;
  }

  readonly companyRepo: CompanyRepository = {
    create: async ({ name, founderId }) => {
      const company: Company = {
        id: this.nextId("c"),
        code: generateCompanyCode((max) => this.nextCounter() % max),
        name,
        founderId,
        status: "active",
        sessionCapSeconds: 28800,
      };
      this.companies.set(company.id, company);
      this.admins.set(company.id, new Set([founderId]));
      return company;
    },
    getById: async (id) => this.companies.get(id) ?? null,
    listForActor: async (actor: Actor) =>
      [...this.companies.values()].filter(
        (c) => actor.kind === "superadmin" || this.admins.get(c.id)?.has(actor.userId),
      ),
    listAdmins: async (companyId) => [...(this.admins.get(companyId) ?? [])],
    grantAccess: async (companyId, adminId) => {
      this.admins.get(companyId)?.add(adminId);
    },
    revokeAccess: async (companyId, adminId) => {
      this.admins.get(companyId)?.delete(adminId);
    },
    setSessionCap: async (companyId, seconds) => {
      const c = this.companies.get(companyId);
      if (c) c.sessionCapSeconds = seconds;
    },
  };

  readonly siteRepo: SiteRepository = {
    create: async ({ companyId, name }) => {
      const site: Site = { id: this.nextId("s"), companyId, name, status: "active" };
      this.sites.set(site.id, site);
      return site;
    },
    getById: async (id) => this.sites.get(id) ?? null,
    listByParent: async (companyId) =>
      [...this.sites.values()].filter((s) => s.companyId === companyId),
  };

  readonly storeRepo: StoreRepository = {
    create: async ({ companyId, siteId, name }) => {
      const store: Store = { id: this.nextId("t"), companyId, siteId, name, status: "active" };
      this.stores.set(store.id, store);
      return store;
    },
    getById: async (id) => this.stores.get(id) ?? null,
    listByParent: async (siteId) =>
      [...this.stores.values()].filter((s) => s.siteId === siteId),
  };

  readonly unitRepo: UnitStatusRepository = {
    getCompanyId: async (level, id) => {
      if (level === "company") return this.companies.has(id) ? id : null;
      if (level === "site") return this.sites.get(id)?.companyId ?? null;
      return this.stores.get(id)?.companyId ?? null;
    },
    setStatus: async (level, id, status, reason) => {
      const unit = this.unit(level, id);
      if (unit) unit.status = status;
      this.reasons.set(`${level}:${id}`, reason);
    },
    softDelete: async (level, id) => {
      this.deleted.add(`${level}:${id}`);
    },
    hasData: async (level, id) => this.withData.has(`${level}:${id}`),
  };

  seedCompany(id: string, founderId: string, extraAdmins: string[] = []): Company {
    const company: Company = {
      id,
      code: "abcd",
      name: id,
      founderId,
      status: "active",
      sessionCapSeconds: 28800,
    };
    this.companies.set(id, company);
    this.admins.set(id, new Set([founderId, ...extraAdmins]));
    return company;
  }

  seedSite(id: string, companyId: string): Site {
    const site: Site = { id, companyId, name: id, status: "active" };
    this.sites.set(id, site);
    return site;
  }

  seedStore(id: string, companyId: string, siteId: string): Store {
    const store: Store = { id, companyId, siteId, name: id, status: "active" };
    this.stores.set(id, store);
    return store;
  }

  private unit(level: Level, id: string): { status: "active" | "inactive" } | undefined {
    if (level === "company") return this.companies.get(id);
    if (level === "site") return this.sites.get(id);
    return this.stores.get(id);
  }
}
