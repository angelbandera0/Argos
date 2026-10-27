import type { CompanyRepository } from "@/core/application/ports/company-repository";
import type { Role, RoleRepository } from "@/core/application/ports/role-repository";
import type { Actor } from "@/core/domain/actor";
import {
  assertAdmin,
  assertCompaniesAccessible,
  assertNameFree,
  assertPermissions,
  assertSessionSeconds,
  normalizeName,
} from "./shared";

export interface CreateRoleDeps {
  roles: RoleRepository;
  companies: CompanyRepository;
}

export interface CreateRoleInput {
  name: string;
  sessionSeconds?: number | null;
  excludedCompanyIds?: string[];
  permissions: Role["permissions"];
}

export function makeCreateRole(deps: CreateRoleDeps) {
  return async (actor: Actor, input: CreateRoleInput): Promise<Role> => {
    assertAdmin(actor);
    const name = normalizeName(input.name);
    const sessionSeconds = input.sessionSeconds ?? null;
    assertSessionSeconds(sessionSeconds);
    assertPermissions(input.permissions);
    const excludedCompanyIds = input.excludedCompanyIds ?? [];
    await assertCompaniesAccessible(deps.companies, actor, excludedCompanyIds);
    await assertNameFree(deps.roles, actor.userId, name);
    return deps.roles.create({
      ownerId: actor.userId,
      name,
      sessionSeconds,
      excludedCompanyIds,
      permissions: input.permissions,
    });
  };
}
