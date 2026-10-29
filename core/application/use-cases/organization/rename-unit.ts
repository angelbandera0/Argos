import type { CompanyRepository, Level } from "@/core/application/ports/company-repository";
import type { SiteRepository } from "@/core/application/ports/site-repository";
import type { StoreRepository } from "@/core/application/ports/store-repository";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { nameKey, validateName } from "@/core/domain/name";

export interface RenameUnitDeps {
  companies: CompanyRepository;
  sites: SiteRepository;
  stores: StoreRepository;
}

export function makeRenameUnit(deps: RenameUnitDeps) {
  return async (actor: Actor, i: { level: Level; id: string; name: string }): Promise<void> => {
    if (actor.kind === "operator") throw new Forbidden();
    const name = validateName(i.name);
    let companyId: string;
    let current: string;
    let siblings: { id: string; name: string }[];
    if (i.level === "company") {
      const c = await deps.companies.getById(i.id);
      if (!c) throw new NotFound();
      companyId = c.id;
      current = c.name;
      siblings = (await deps.companies.listForActor(actor)).filter((x) => x.founderId === c.founderId);
    } else if (i.level === "site") {
      const s = await deps.sites.getById(i.id);
      if (!s) throw new NotFound();
      companyId = s.companyId;
      current = s.name;
      siblings = await deps.sites.listByParent(s.companyId);
    } else {
      const s = await deps.stores.getById(i.id);
      if (!s) throw new NotFound();
      companyId = s.companyId;
      current = s.name;
      siblings = await deps.stores.listByParent(s.siteId);
    }
    if (actor.kind === "admin" && !(await deps.companies.listAdmins(companyId)).includes(actor.userId)) {
      throw new Forbidden();
    }
    if (name === current) return;
    if (siblings.some((x) => x.id !== i.id && nameKey(x.name) === nameKey(name))) {
      throw new RuleViolation("NAME_TAKEN");
    }
    if (i.level === "company") await deps.companies.rename(i.id, name);
    else if (i.level === "site") await deps.sites.rename(i.id, name);
    else await deps.stores.rename(i.id, name);
  };
}
