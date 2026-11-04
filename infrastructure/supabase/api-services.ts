import "server-only";
import { createClient } from "@supabase/supabase-js";
import { makeListAdmins } from "@/core/application/use-cases/access/list-admins";
import { getEnv } from "@/infrastructure/env";
import { makeCatalog } from "./catalog-factory";
import { makeHistory } from "./history-factory";
import { makeOrg } from "./org-factory";
import { makeRoles } from "./roles-factory";
import { makeUsers } from "./users-factory";

/** Use cases bound to the API caller's own JWT (RLS applies). */
export function makeApiServices(token: string) {
  const env = getEnv();
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const org = makeOrg(supabase);
  return {
    org,
    roles: makeRoles(supabase),
    users: makeUsers(supabase),
    catalog: makeCatalog(supabase),
    history: makeHistory(supabase),
    listAdmins: makeListAdmins({ users: org.users }),
  };
}

export type ApiServices = ReturnType<typeof makeApiServices>;
