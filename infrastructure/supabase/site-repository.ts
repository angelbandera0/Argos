import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Site, SiteRepository } from "@/core/application/ports/site-repository";
import { orgError } from "@/infrastructure/supabase/org-errors";

const COLUMNS = "id, company_id, name, status";

type Row = { id: string; company_id: string; name: string; status: Site["status"] };

const toSite = (r: Row): Site => ({
  id: r.id,
  companyId: r.company_id,
  name: r.name,
  status: r.status,
});

export function makeSiteRepository(client: SupabaseClient): SiteRepository {
  return {
    async create({ companyId, name }) {
      const { data, error } = await client
        .from("sites")
        .insert({ company_id: companyId, name })
        .select(COLUMNS)
        .single();
      if (error) orgError("SiteRepository.create", error);
      return toSite(data as Row);
    },

    async getById(id) {
      const { data, error } = await client
        .from("sites")
        .select(COLUMNS)
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) orgError("SiteRepository.getById", error);
      return data ? toSite(data as Row) : null;
    },

    async listByParent(companyId) {
      const { data, error } = await client
        .from("sites")
        .select(COLUMNS)
        .eq("company_id", companyId)
        .is("deleted_at", null)
        .order("name");
      if (error) orgError("SiteRepository.listByParent", error);
      return (data as Row[]).map(toSite);
    },
  };
}
