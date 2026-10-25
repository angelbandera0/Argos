import type { CompanyRepository } from "@/core/application/ports/company-repository";
import type { Site, SiteRepository } from "@/core/application/ports/site-repository";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, NotFound } from "@/core/domain/errors";

export interface CreateSiteDeps {
  companies: CompanyRepository;
  sites: SiteRepository;
}

export function makeCreateSite(deps: CreateSiteDeps) {
  return async (actor: Actor, i: { companyId: string; name: string }): Promise<Site> => {
    if (actor.kind !== "admin") throw new Forbidden();
    if (!(await deps.companies.getById(i.companyId))) throw new NotFound();
    const admins = await deps.companies.listAdmins(i.companyId);
    if (!admins.includes(actor.userId)) throw new Forbidden();
    return deps.sites.create({ companyId: i.companyId, name: i.name });
  };
}
