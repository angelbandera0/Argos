import type { AuthGateway } from "@/core/application/ports/auth-gateway";
import type { UserRepository } from "@/core/application/ports/user-repository";
import type { Actor } from "@/core/domain/actor";
import { Forbidden } from "@/core/domain/errors";

export interface CreateAdminDeps {
  auth: AuthGateway;
  users: UserRepository;
}

export function makeCreateAdmin(deps: CreateAdminDeps) {
  return async (
    actor: Actor,
    i: { email: string; displayName: string },
  ): Promise<{ adminId: string; temporaryPassword: string }> => {
    if (actor.kind !== "superadmin") throw new Forbidden();
    const { userId, temporaryPassword } = await deps.auth.createAdminUser({
      email: i.email,
      displayName: i.displayName,
    });
    return { adminId: userId, temporaryPassword };
  };
}
