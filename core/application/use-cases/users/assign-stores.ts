import type { CompanyRepository } from "@/core/application/ports/company-repository";
import type { RoleRepository } from "@/core/application/ports/role-repository";
import type { StoreRepository } from "@/core/application/ports/store-repository";
import type { UserRepository } from "@/core/application/ports/user-repository";
import type { Actor } from "@/core/domain/actor";
import {
  assertRoleNotExcluded,
  assertRoleOwned,
  assertStoresInCompany,
  loadManagedOperator,
} from "./shared";

export interface AssignStoresDeps {
  users: UserRepository;
  companies: CompanyRepository;
  stores: StoreRepository;
  roles: RoleRepository;
}

export function makeAssignStores(deps: AssignStoresDeps) {
  return async (
    actor: Actor,
    input: { userId: string; assignments: { storeId: string; roleId: string }[] },
  ): Promise<void> => {
    const target = await loadManagedOperator(deps, actor, input.userId);
    // A repeated storeId: the last occurrence wins.
    const assignments = [
      ...new Map(input.assignments.map((a) => [a.storeId, a] as const)).values(),
    ];
    const current = await deps.users.listAssignments(target.id);
    for (const roleId of new Set(current.map((a) => a.roleId))) {
      await assertRoleOwned(deps.roles, actor, roleId);
    }
    for (const roleId of new Set(assignments.map((a) => a.roleId))) {
      await assertRoleOwned(deps.roles, actor, roleId);
      await assertRoleNotExcluded(deps.roles, roleId, target.companyId);
    }
    await assertStoresInCompany(
      deps.stores,
      target.companyId,
      assignments.map((a) => a.storeId),
    );
    await deps.users.assignStores(target.id, assignments);
  };
}
