import type { RoleRepository } from "@/core/application/ports/role-repository";
import type { Actor } from "@/core/domain/actor";
import { RuleViolation } from "@/core/domain/errors";
import { assertAdmin, loadOwnedRole } from "./shared";

export interface DeleteRoleDeps {
  roles: RoleRepository;
}

export function makeDeleteRole(deps: DeleteRoleDeps) {
  return async (actor: Actor, roleId: string): Promise<void> => {
    assertAdmin(actor);
    const role = await loadOwnedRole(deps.roles, actor, roleId);
    if (await deps.roles.hasAssignments(role.id)) throw new RuleViolation("HAS_DATA");
    await deps.roles.softDelete(role.id);
  };
}
