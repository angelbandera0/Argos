import type { AuthGateway } from "@/core/application/ports/auth-gateway";
import type { CompanyRepository } from "@/core/application/ports/company-repository";
import type { RoleRepository } from "@/core/application/ports/role-repository";
import type { StoreRepository } from "@/core/application/ports/store-repository";
import type { UserRepository } from "@/core/application/ports/user-repository";
import type { Actor } from "@/core/domain/actor";
import { NotFound, RuleViolation } from "@/core/domain/errors";
import { formatUsername, isValidUsernameName, normalizeUsername } from "@/core/domain/username";
import {
  assertAdmin,
  assertCompanyAccess,
  assertRoleNotExcluded,
  assertRoleOwned,
  assertStoresInCompany,
} from "./shared";

export interface CreateOperatorDeps {
  users: UserRepository;
  auth: AuthGateway;
  companies: CompanyRepository;
  stores: StoreRepository;
  roles: RoleRepository;
}

export interface CreateOperatorInput {
  companyId: string;
  name: string;
  displayName: string;
  roleId: string;
  storeIds: string[];
}

const MAX_DISPLAY_NAME = 80;

export function makeCreateOperator(deps: CreateOperatorDeps) {
  return async (
    actor: Actor,
    input: CreateOperatorInput,
  ): Promise<{ userId: string; username: string; pin: string }> => {
    assertAdmin(actor);
    await assertCompanyAccess(deps.companies, actor, input.companyId);
    await assertRoleOwned(deps.roles, actor, input.roleId);
    if (!isValidUsernameName(normalizeUsername(input.name))) {
      throw new RuleViolation("INVALID_USERNAME");
    }
    const displayName = input.displayName.trim();
    if (displayName.length < 1 || displayName.length > MAX_DISPLAY_NAME) {
      throw new RuleViolation("INVALID_NAME");
    }
    const company = await deps.companies.getById(input.companyId);
    if (!company) throw new NotFound();
    const username = formatUsername(company.code, input.name);
    if (await deps.users.findByUsername(username)) throw new RuleViolation("NAME_TAKEN");
    if (input.storeIds.length === 0) throw new NotFound();
    await assertStoresInCompany(deps.stores, company.id, input.storeIds);
    await assertRoleNotExcluded(deps.roles, input.roleId, company.id);

    const { userId, pin } = await deps.auth.createOperatorUser({
      username,
      companyId: company.id,
      displayName,
    });
    await deps.users.assignStores(
      userId,
      input.storeIds.map((storeId) => ({ storeId, roleId: input.roleId })),
    );
    return { userId, username, pin };
  };
}
