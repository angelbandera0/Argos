import type { CompanyRepository } from "@/core/application/ports/company-repository";
import type { Role, RoleRepository } from "@/core/application/ports/role-repository";
import type { Actor } from "@/core/domain/actor";
import { assertAdmin, assertCompaniesAccessible, loadOwnedRole } from "./shared";

export interface SetRoleCompanyExclusionsDeps {
  roles: RoleRepository;
  companies: CompanyRepository;
}

export function makeSetRoleCompanyExclusions(deps: SetRoleCompanyExclusionsDeps) {
  return async (actor: Actor, i: { roleId: string; companyIds: string[] }): Promise<Role> => {
    assertAdmin(actor);
    const role = await loadOwnedRole(deps.roles, actor, i.roleId);
    await assertCompaniesAccessible(deps.companies, actor, i.companyIds);
    return deps.roles.update(role.id, { excludedCompanyIds: i.companyIds });
  };
}
