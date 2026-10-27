import type { CompanyRepository } from "@/core/application/ports/company-repository";
import type { RoleRepository } from "@/core/application/ports/role-repository";
import type { UserRepository } from "@/core/application/ports/user-repository";
import type { Actor } from "@/core/domain/actor";
import { NotFound } from "@/core/domain/errors";
import { assertRoleNotExcluded, assertRoleOwned, loadManagedOperator } from "./shared";

export interface ChangeOperatorRoleDeps {
  users: UserRepository;
  companies: CompanyRepository;
  roles: RoleRepository;
}

export function makeChangeOperatorRole(deps: ChangeOperatorRoleDeps) {
  return async (
    actor: Actor,
    input: { userId: string; storeId: string | null; roleId: string },
  ): Promise<void> => {
    const target = await loadManagedOperator(deps, actor, input.userId);
    await assertRoleOwned(deps.roles, actor, input.roleId);
    await assertRoleNotExcluded(deps.roles, input.roleId, target.companyId);
    const current = await deps.users.listAssignments(target.id);
    const changing = current.filter((a) => input.storeId === null || a.storeId === input.storeId);
    if (changing.length === 0) throw new NotFound();
    for (const roleId of new Set(changing.map((a) => a.roleId))) {
      await assertRoleOwned(deps.roles, actor, roleId);
    }
    const changed = new Set(changing.map((a) => a.storeId));
    await deps.users.assignStores(
      target.id,
      current.map((a) => ({
        storeId: a.storeId,
        roleId: changed.has(a.storeId) ? input.roleId : a.roleId,
      })),
    );
  };
}
