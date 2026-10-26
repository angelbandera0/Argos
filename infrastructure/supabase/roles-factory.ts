import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { makeCreateRole } from "@/core/application/use-cases/roles/create-role";
import { makeDeleteRole } from "@/core/application/use-cases/roles/delete-role";
import { makeListRoles } from "@/core/application/use-cases/roles/list-roles";
import { makeSetRoleCompanyExclusions } from "@/core/application/use-cases/roles/set-role-company-exclusions";
import { makeUpdateRole } from "@/core/application/use-cases/roles/update-role";
import { makeCompanyRepository } from "./company-repository";
import { makeRoleRepository } from "./role-repository";

/** Role use cases bound to one request's user client (RLS applies). */
export function makeRoles(supabase: SupabaseClient) {
  const roles = makeRoleRepository(supabase);
  const companies = makeCompanyRepository(supabase);
  return {
    roles,
    listRoles: makeListRoles({ roles }),
    createRole: makeCreateRole({ roles, companies }),
    updateRole: makeUpdateRole({ roles, companies }),
    setExclusions: makeSetRoleCompanyExclusions({ roles, companies }),
    deleteRole: makeDeleteRole({ roles }),
  };
}
