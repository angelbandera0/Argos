import type { AuthGateway } from "@/core/application/ports/auth-gateway";
import type { CompanyRepository } from "@/core/application/ports/company-repository";
import type { UserRepository } from "@/core/application/ports/user-repository";
import type { Actor } from "@/core/domain/actor";
import { loadManagedOperator } from "./shared";

export interface DeactivateUserDeps {
  users: UserRepository;
  auth: AuthGateway;
  companies: CompanyRepository;
}

export function makeDeactivateUser(deps: DeactivateUserDeps) {
  return async (actor: Actor, input: { userId: string }): Promise<void> => {
    const target = await loadManagedOperator(deps, actor, input.userId);
    await deps.users.setStatus(target.id, "deactivated");
    await deps.auth.revokeSessions(target.id);
  };
}
