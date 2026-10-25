import type { CompanyRepository } from "@/core/application/ports/company-repository";
import type { SiteRepository } from "@/core/application/ports/site-repository";
import type { Store, StoreRepository } from "@/core/application/ports/store-repository";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, NotFound } from "@/core/domain/errors";

export interface CreateStoreDeps {
  companies: CompanyRepository;
  sites: SiteRepository;
  stores: StoreRepository;
}

export function makeCreateStore(deps: CreateStoreDeps) {
  return async (
    actor: Actor,
    i: { companyId: string; siteId: string; name: string },
  ): Promise<Store> => {
    if (actor.kind !== "admin") throw new Forbidden();
    if (!(await deps.companies.getById(i.companyId))) throw new NotFound();
    const admins = await deps.companies.listAdmins(i.companyId);
    if (!admins.includes(actor.userId)) throw new Forbidden();
    const site = await deps.sites.getById(i.siteId);
    if (!site || site.companyId !== i.companyId) throw new NotFound();
    return deps.stores.create({ companyId: i.companyId, siteId: i.siteId, name: i.name });
  };
}
