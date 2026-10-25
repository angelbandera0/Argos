import type { CompanyRepository } from "@/core/application/ports/company-repository";
import type { UserRepository } from "@/core/application/ports/user-repository";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, NotFound } from "@/core/domain/errors";

export interface GrantCompanyAccessDeps {
  companies: CompanyRepository;
  users: UserRepository;
}

export function makeGrantCompanyAccess(deps: GrantCompanyAccessDeps) {
  return async (actor: Actor, i: { companyId: string; adminId: string }): Promise<void> => {
    if (actor.kind === "operator") throw new Forbidden();
    if (!(await deps.companies.getById(i.companyId))) throw new NotFound();
    if (actor.kind === "admin") {
      const admins = await deps.companies.listAdmins(i.companyId);
      if (!admins.includes(actor.userId)) throw new Forbidden();
    }
    const target = await deps.users.getProfile(i.adminId);
    if (!target || target.kind !== "admin") throw new NotFound();
    await deps.companies.grantAccess(i.companyId, i.adminId, actor.userId);
  };
}
