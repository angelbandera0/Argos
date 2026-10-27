import type { AuthGateway } from "@/core/application/ports/auth-gateway";
import type { UserRepository } from "@/core/application/ports/user-repository";
import type { Actor } from "@/core/domain/actor";
import { Forbidden } from "@/core/domain/errors";
import { validateAdminPassword } from "@/core/domain/password";

export interface ChangeOwnPasswordDeps {
  auth: AuthGateway;
  users?: UserRepository;
}

export function makeChangeOwnPassword(deps: ChangeOwnPasswordDeps) {
  return async (actor: Actor, i: { newPassword: string }): Promise<void> => {
    if (actor.kind === "operator") throw new Forbidden();
    validateAdminPassword(i.newPassword);
    await deps.auth.setPassword(actor.userId, i.newPassword);
  };
}
