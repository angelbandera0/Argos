import type { CompanyRepository } from "@/core/application/ports/company-repository";
import type { Role, RoleRepository } from "@/core/application/ports/role-repository";
import type { Actor } from "@/core/domain/actor";
import {
  assertAdmin,
  assertNameFree,
  assertPermissions,
  assertSessionSeconds,
  loadOwnedRole,
  mergeExclusions,
  normalizeName,
} from "./shared";

export interface UpdateRoleDeps {
  roles: RoleRepository;
  companies: CompanyRepository;
}

export type UpdateRolePatch = Partial<Omit<Role, "id" | "ownerId">>;

export function makeUpdateRole(deps: UpdateRoleDeps) {
  return async (actor: Actor, roleId: string, patch: UpdateRolePatch): Promise<Role> => {
    assertAdmin(actor);
    const role = await loadOwnedRole(deps.roles, actor, roleId);
    const clean: UpdateRolePatch = { ...patch };
    if (patch.name !== undefined) {
      clean.name = normalizeName(patch.name);
      await assertNameFree(deps.roles, actor.userId, clean.name, role.id);
    }
    if (patch.sessionSeconds !== undefined) assertSessionSeconds(patch.sessionSeconds);
    if (patch.permissions !== undefined) assertPermissions(patch.permissions);
    if (patch.excludedCompanyIds !== undefined) {
      clean.excludedCompanyIds = await mergeExclusions(deps.companies, actor, role.excludedCompanyIds, patch.excludedCompanyIds);
    }
    return deps.roles.update(role.id, clean);
  };
}
