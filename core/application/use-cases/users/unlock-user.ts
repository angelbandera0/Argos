import type { AuthGateway } from "@/core/application/ports/auth-gateway";
import type { CompanyRepository } from "@/core/application/ports/company-repository";
import type { UserRepository } from "@/core/application/ports/user-repository";
import type { Actor } from "@/core/domain/actor";
import { NotFound } from "@/core/domain/errors";
import { loadManagedOperator } from "./shared";

export interface UnlockUserDeps {
  users: UserRepository;
  auth: AuthGateway;
  companies: CompanyRepository;
}

export function makeUnlockUser(deps: UnlockUserDeps) {
  return async (actor: Actor, input: { userId: string }): Promise<{ pin: string }> => {
    const target = await loadManagedOperator(deps, actor, input.userId);
    if (target.status !== "locked") throw new NotFound();
    const { pin } = await deps.auth.resetPin(target.id);
    await deps.users.setStatus(target.id, "active");
    await deps.auth.revokeSessions(target.id);
    return { pin };
  };
}
