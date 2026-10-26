import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { makeChooseStore } from "@/core/application/use-cases/access/choose-store";
import { makeLoginWithPin } from "@/core/application/use-cases/access/login-with-pin";
import { makeLogout } from "@/core/application/use-cases/access/logout";
import { makeSwitchStore } from "@/core/application/use-cases/access/switch-store";
import { makeAssignStores } from "@/core/application/use-cases/users/assign-stores";
import { makeChangeOperatorRole } from "@/core/application/use-cases/users/change-operator-role";
import { makeCreateOperator } from "@/core/application/use-cases/users/create-operator";
import { makeDeactivateUser } from "@/core/application/use-cases/users/deactivate-user";
import { makeResetPin } from "@/core/application/use-cases/users/reset-pin";
import { makeUnlockUser } from "@/core/application/use-cases/users/unlock-user";
import { makeAuthGateway } from "./auth-gateway";
import { makeCompanyRepository } from "./company-repository";
import { makePinVerifier } from "./pin-verifier";
import { makeRoleRepository } from "./role-repository";
import { makeSessionRepository } from "./session-repository";
import { makeStoreAccessReader } from "./store-access-reader";
import { makeStoreRepository } from "./store-repository";
import { makeUserRepository } from "./user-repository";

const clock = { now: () => new Date() };

/** Operator and session use cases bound to one request's user client (RLS applies). */
export function makeUsers(supabase: SupabaseClient, auth = makeAuthGateway()) {
  const users = makeUserRepository(supabase);
  const sessions = makeSessionRepository(supabase);
  const access = makeStoreAccessReader(supabase);
  const companies = makeCompanyRepository(supabase);
  const stores = makeStoreRepository(supabase);
  const roles = makeRoleRepository(supabase);
  const verifier = makePinVerifier(supabase);
  return {
    users,
    sessions,
    access,
    auth,
    loginWithPin: makeLoginWithPin({ verifier, users, sessions, access, clock, auth }),
    chooseStore: makeChooseStore({ sessions, access, clock }),
    switchStore: makeSwitchStore({ sessions, access, clock }),
    logout: makeLogout({ sessions }),
    createOperator: makeCreateOperator({ users, auth, companies, stores, roles }),
    assignStores: makeAssignStores({ users, companies, stores, roles }),
    changeOperatorRole: makeChangeOperatorRole({ users, companies, roles }),
    resetPin: makeResetPin({ users, auth, companies }),
    unlockUser: makeUnlockUser({ users, auth, companies }),
    deactivateUser: makeDeactivateUser({ users, auth, companies }),
  };
}
