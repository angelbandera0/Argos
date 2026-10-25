import type { AuthGateway } from "@/core/application/ports/auth-gateway";
import type { CompanyRepository } from "@/core/application/ports/company-repository";
import type { UserRepository } from "@/core/application/ports/user-repository";
import type { Actor } from "@/core/domain/actor";
import { loadManagedOperator } from "./shared";

export interface ResetPinDeps {
  users: UserRepository;
  auth: AuthGateway;
  companies: CompanyRepository;
}

export function makeResetPin(deps: ResetPinDeps) {
  return async (actor: Actor, input: { userId: string }): Promise<{ pin: string }> => {
    const target = await loadManagedOperator(deps, actor, input.userId);
    const { pin } = await deps.auth.resetPin(target.id);
    await deps.auth.revokeSessions(target.id);
    return { pin };
  };
}
