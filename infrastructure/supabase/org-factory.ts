import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { makeCreateCompany } from "@/core/application/use-cases/organization/create-company";
import { makeCreateSite } from "@/core/application/use-cases/organization/create-site";
import { makeCreateStore } from "@/core/application/use-cases/organization/create-store";
import { makeDeactivateUnit } from "@/core/application/use-cases/organization/deactivate-unit";
import { makeGrantCompanyAccess } from "@/core/application/use-cases/organization/grant-company-access";
import { makeListCompanies } from "@/core/application/use-cases/organization/list-companies";
import { makeReactivateUnit } from "@/core/application/use-cases/organization/reactivate-unit";
import { makeRevokeCompanyAccess } from "@/core/application/use-cases/organization/revoke-company-access";
import { makeRenameUnit } from "@/core/application/use-cases/organization/rename-unit";
import { makeUpdateCompanySettings } from "@/core/application/use-cases/organization/update-company-settings";
import { makeCompanyRepository } from "./company-repository";
import { makeSiteRepository } from "./site-repository";
import { makeStoreRepository } from "./store-repository";
import { makeUnitStatusRepository } from "./unit-status-repository";
import { makeUserRepository } from "./user-repository";

/** Organization use cases bound to one request's user client (RLS applies). */
export function makeOrg(supabase: SupabaseClient) {
  const companies = makeCompanyRepository(supabase);
  const sites = makeSiteRepository(supabase);
  const stores = makeStoreRepository(supabase);
  const units = makeUnitStatusRepository(supabase);
  const users = makeUserRepository(supabase);
  return {
    companies,
    sites,
    stores,
    users,
    listCompanies: makeListCompanies({ companies }),
    createCompany: makeCreateCompany({ companies }),
    createSite: makeCreateSite({ companies, sites }),
    createStore: makeCreateStore({ companies, sites, stores }),
    deactivateUnit: makeDeactivateUnit({ units, companies }),
    grantAccess: makeGrantCompanyAccess({ companies, users }),
    revokeAccess: makeRevokeCompanyAccess({ companies }),
    renameUnit: makeRenameUnit({ companies, sites, stores }),
    updateSettings: makeUpdateCompanySettings({ companies }),
    reactivateUnit: makeReactivateUnit({ units, companies }),
  };
}
