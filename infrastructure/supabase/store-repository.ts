import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Store, StoreRepository } from "@/core/application/ports/store-repository";
import { orgError } from "@/infrastructure/supabase/org-errors";

const COLUMNS = "id, company_id, site_id, name, status";

type Row = {
  id: string;
  company_id: string;
  site_id: string;
  name: string;
  status: Store["status"];
};

const toStore = (r: Row): Store => ({
  id: r.id,
  companyId: r.company_id,
  siteId: r.site_id,
  name: r.name,
  status: r.status,
});

export function makeStoreRepository(client: SupabaseClient): StoreRepository {
  return {
    async create({ companyId, siteId, name }) {
      const { data, error } = await client
        .from("stores")
        .insert({ company_id: companyId, site_id: siteId, name })
        .select(COLUMNS)
        .single();
      if (error) orgError("StoreRepository.create", error);
      return toStore(data as Row);
    },

    async getById(id) {
      const { data, error } = await client
        .from("stores")
        .select(COLUMNS)
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) orgError("StoreRepository.getById", error);
      return data ? toStore(data as Row) : null;
    },

    async listByParent(siteId) {
      const { data, error } = await client
        .from("stores")
        .select(COLUMNS)
        .eq("site_id", siteId)
        .is("deleted_at", null)
        .order("name");
      if (error) orgError("StoreRepository.listByParent", error);
      return (data as Row[]).map(toStore);
    },
  };
}
