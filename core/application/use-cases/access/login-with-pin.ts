import type { Clock } from "@/core/application/ports/clock";
import type { PinVerifier } from "@/core/application/ports/pin-verifier";
import type { SessionRepository } from "@/core/application/ports/session-repository";
import type { StoreAccessReader, StoreOption } from "@/core/application/ports/store-access-reader";
import type { UserRepository } from "@/core/application/ports/user-repository";
import { AuthFailed } from "@/core/domain/errors";

export interface LoginWithPinDeps {
  verifier: PinVerifier;
  users: UserRepository;
  sessions: SessionRepository;
  access: StoreAccessReader;
  clock: Clock;
}

export function makeLoginWithPin(deps: LoginWithPinDeps) {
  return async (input: {
    username: string;
    pin: string;
  }): Promise<{ userId: string; sessionId: string; stores: StoreOption[] }> => {
    const verified = await deps.verifier.verify(input.username, input.pin);
    if (!verified) throw new AuthFailed();
    // Defense in depth: the verifier alone is not trusted to enforce kind/status.
    const profile = await deps.users.getProfile(verified.userId);
    if (!profile || profile.kind !== "operator" || profile.status !== "active") {
      throw new AuthFailed();
    }
    await deps.sessions.start({
      sessionId: verified.sessionId,
      userId: verified.userId,
      startedAt: deps.clock.now(),
    });
    const stores = (await deps.access.listStoreAccess(verified.userId)).map((s) => ({
      ...s,
      available: s.operational,
    }));
    return { userId: verified.userId, sessionId: verified.sessionId, stores };
  };
}
