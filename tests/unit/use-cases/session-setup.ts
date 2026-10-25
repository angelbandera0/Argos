import { assertSessionActive } from "@/core/application/use-cases/access/assert-session-active";
import { makeChooseStore } from "@/core/application/use-cases/access/choose-store";
import { makeLoginWithPin } from "@/core/application/use-cases/access/login-with-pin";
import { makeLogout } from "@/core/application/use-cases/access/logout";
import { makeSwitchStore } from "@/core/application/use-cases/access/switch-store";
import type { StoreAccess } from "@/core/application/ports/store-access-reader";
import type { Actor } from "@/core/domain/actor";
import { FakeClock } from "../../fakes/fake-clock";
import { InMemorySessions } from "../../fakes/in-memory-sessions";
import { FakePinVerifier, FakeStoreAccess } from "../../fakes/fake-store-access";
import { InMemoryUserRepository } from "../../fakes/in-memory-user-repository";

export const T0 = new Date("2026-01-01T08:00:00.000Z");
export const HOUR = 3_600_000;

const access = (storeId: string, o: Partial<StoreAccess> = {}): StoreAccess => ({
  storeId,
  storeName: `Store ${storeId}`,
  siteName: "Site 1",
  companyId: "c1",
  roleId: "r1",
  roleName: "Cashier",
  roleSessionSeconds: null,
  companyCapSeconds: 86400,
  operational: true,
  ...o,
});

export const operatorActor = (sessionId: string | null = "sess1"): Actor => ({
  userId: "u1",
  kind: "operator",
  channel: "app",
  ...(sessionId === null ? {} : { sessionId }),
});

export function setup() {
  const clock = new FakeClock(T0);
  const sessions = new InMemorySessions(clock);
  const users = new InMemoryUserRepository();
  const profile = (id: string, username: string, status: "active" | "locked" | "deactivated", kind: Actor["kind"] = "operator") =>
    users.profiles.set(id, { id, kind, username, displayName: id, companyId: "c1", status, mustChangePassword: false });
  profile("u1", "abcd.ana", "active");
  profile("u2", "abcd.lock", "locked");
  profile("u3", "abcd.gone", "deactivated");
  profile("u4", "abcd.boss", "active", "admin");
  const storeAccess = new FakeStoreAccess({
    u1: [
      access("t1"),
      access("t2", { storeName: "Store t2", roleSessionSeconds: 3600 }),
      access("t3", { roleSessionSeconds: 14400 }),
      access("t4", { operational: false }),
      access("t5", { companyCapSeconds: 172800 }),
    ],
  });
  const verifier = new FakePinVerifier({
    "abcd.ana:123456": { userId: "u1", sessionId: "sess1" },
    "abcd.lock:123456": { userId: "u2", sessionId: "sess2" },
    "abcd.gone:123456": { userId: "u3", sessionId: "sess3" },
    "abcd.boss:123456": { userId: "u4", sessionId: "sess4" },
    "abcd.ghost:123456": { userId: "ghost", sessionId: "sess5" },
  });
  const deps = { verifier, users, sessions, access: storeAccess, clock };
  return {
    clock,
    sessions,
    login: makeLoginWithPin(deps),
    choose: makeChooseStore(deps),
    switchStore: makeSwitchStore(deps),
    logout: makeLogout(deps),
    assertActive: (actor: Actor) => assertSessionActive(deps, actor),
  };
}
