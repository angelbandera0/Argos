import type { Role, RoleRepository } from "@/core/application/ports/role-repository";
import type { Actor } from "@/core/domain/actor";
import { assertAdmin } from "./shared";

export interface ListRolesDeps {
  roles: RoleRepository;
}

export function makeListRoles(deps: ListRolesDeps) {
  return async (actor: Actor): Promise<Role[]> => {
    assertAdmin(actor);
    return deps.roles.listByOwner(actor.userId);
  };
}
