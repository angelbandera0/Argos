import type { CompanyRepository } from "@/core/application/ports/company-repository";
import type { Role, RoleRepository } from "@/core/application/ports/role-repository";
import type { Actor } from "@/core/domain/actor";
import { assertAdmin, loadOwnedRole, mergeExclusions } from "./shared";

export interface SetRoleCompanyExclusionsDeps {
  roles: RoleRepository;
  companies: CompanyRepository;
}

export function makeSetRoleCompanyExclusions(deps: SetRoleCompanyExclusionsDeps) {
  return async (actor: Actor, i: { roleId: string; companyIds: string[] }): Promise<Role> => {
    assertAdmin(actor);
    const role = await loadOwnedRole(deps.roles, actor, i.roleId);
    const excludedCompanyIds = await mergeExclusions(deps.companies, actor, role.excludedCompanyIds, i.companyIds);
    return deps.roles.update(role.id, { excludedCompanyIds });
  };
}
