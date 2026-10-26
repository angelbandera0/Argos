import type { Profile, UserRepository } from "@/core/application/ports/user-repository";
import type { Actor } from "@/core/domain/actor";
import { Forbidden } from "@/core/domain/errors";

export function makeListAdmins(deps: { users: Pick<UserRepository, "listAdmins"> }) {
  return async (actor: Actor): Promise<Profile[]> => {
    if (actor.kind !== "superadmin") throw new Forbidden();
    return deps.users.listAdmins();
  };
}
