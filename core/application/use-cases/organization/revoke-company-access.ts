import type { CompanyRepository } from "@/core/application/ports/company-repository";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";

export interface RevokeCompanyAccessDeps {
  companies: CompanyRepository;
}

export function makeRevokeCompanyAccess(deps: RevokeCompanyAccessDeps) {
  return async (actor: Actor, i: { companyId: string; adminId: string }): Promise<void> => {
    if (actor.kind === "operator") throw new Forbidden();
    const company = await deps.companies.getById(i.companyId);
    if (!company) throw new NotFound();
    if (actor.kind === "admin" && company.founderId !== actor.userId) throw new Forbidden();
    if (i.adminId === company.founderId) throw new RuleViolation("FOUNDER_PROTECTED");
    await deps.companies.revokeAccess(i.companyId, i.adminId);
  };
}
