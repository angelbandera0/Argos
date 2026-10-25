import type { CompanyRepository } from "@/core/application/ports/company-repository";
import type { RoleRepository } from "@/core/application/ports/role-repository";
import type { StoreRepository } from "@/core/application/ports/store-repository";
import type { Profile, UserRepository } from "@/core/application/ports/user-repository";
import type { Actor } from "@/core/domain/actor";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";

export function assertAdmin(actor: Actor): void {
  if (actor.kind !== "admin") throw new Forbidden();
}

export async function assertCompanyAccess(
  companies: CompanyRepository,
  actor: Actor,
  companyId: string,
): Promise<void> {
  if (!(await companies.listAdmins(companyId)).includes(actor.userId)) throw new Forbidden();
}

/** Admin-only; loads an operator the actor may manage. Missing/foreign -> Forbidden, non-operator -> NotFound. */
export async function loadManagedOperator(
  deps: { users: UserRepository; companies: CompanyRepository },
  actor: Actor,
  userId: string,
): Promise<Profile & { companyId: string }> {
  assertAdmin(actor);
  const profile = await deps.users.getProfile(userId);
  if (!profile || !profile.companyId) throw new Forbidden();
  await assertCompanyAccess(deps.companies, actor, profile.companyId);
  if (profile.kind !== "operator") throw new NotFound();
  return { ...profile, companyId: profile.companyId };
}

export async function assertRoleOwned(roles: RoleRepository, actor: Actor, roleId: string): Promise<void> {
  const role = await roles.getById(roleId);
  if (!role || role.ownerId !== actor.userId) throw new Forbidden();
}

export async function assertRoleNotExcluded(
  roles: RoleRepository,
  roleId: string,
  companyId: string,
): Promise<void> {
  const role = await roles.getById(roleId);
  if (role?.excludedCompanyIds.includes(companyId)) throw new RuleViolation("ROLE_EXCLUDED");
}

export async function assertStoresInCompany(
  stores: StoreRepository,
  companyId: string,
  storeIds: string[],
): Promise<void> {
  for (const id of storeIds) {
    const store = await stores.getById(id);
    if (!store || store.companyId !== companyId) throw new NotFound();
  }
}
