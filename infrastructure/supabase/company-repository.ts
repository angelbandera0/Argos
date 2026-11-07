import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Company, CompanyRepository } from "@/core/application/ports/company-repository";
import { RuleViolation } from "@/core/domain/errors";
import { orgError } from "@/infrastructure/supabase/org-errors";

const COLUMNS = "id, code, name, founder_id, status, session_cap_seconds";

type Row = {
  id: string;
  code: string;
  name: string;
  founder_id: string;
  status: Company["status"];
  session_cap_seconds: number;
};

const toCompany = (r: Row): Company => ({
  id: r.id,
  code: r.code,
  name: r.name,
  founderId: r.founder_id,
  status: r.status,
  sessionCapSeconds: r.session_cap_seconds,
});

export function makeCompanyRepository(client: SupabaseClient): CompanyRepository {
  return {
    async create({ name }) {
      const { data, error } = await client.rpc("create_company", { p_name: name });
      if (error) orgError("CompanyRepository.create", error);
      return toCompany(data as Row);
    },

    async getById(id) {
      const { data, error } = await client
        .from("companies")
        .select(COLUMNS)
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) orgError("CompanyRepository.getById", error);
      return data ? toCompany(data as Row) : null;
    },

    async listForActor() {
      const { data, error } = await client
        .from("companies")
        .select(COLUMNS)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) orgError("CompanyRepository.listForActor", error);
      return (data as Row[]).map(toCompany);
    },

    async listAdmins(companyId) {
      const { data, error } = await client
        .from("company_admins")
        .select("admin_id")
        .eq("company_id", companyId);
      if (error) orgError("CompanyRepository.listAdmins", error);
      return (data as { admin_id: string }[]).map((r) => r.admin_id);
    },

    async grantAccess(companyId, adminId, grantedBy) {
      const { error } = await client
        .from("company_admins")
        .insert({ company_id: companyId, admin_id: adminId, granted_by: grantedBy });
      if (error) orgError("CompanyRepository.grantAccess", error);
    },

    async revokeAccess(companyId, adminId) {
      const { data, error } = await client
        .from("company_admins")
        .delete()
        .eq("company_id", companyId)
        .eq("admin_id", adminId)
        .select("admin_id");
      if (error) orgError("CompanyRepository.revokeAccess", error);
      if (data.length === 0) {
        const company = await this.getById(companyId);
        if (company?.founderId === adminId) throw new RuleViolation("FOUNDER_PROTECTED");
      }
    },

    async rename(companyId, name) {
      const { error } = await client.from("companies").update({ name }).eq("id", companyId);
      if (error) orgError("CompanyRepository.rename", error);
    },

    async setSessionCap(companyId, seconds) {
      const { error } = await client
        .from("companies")
        .update({ session_cap_seconds: seconds })
        .eq("id", companyId);
      if (error) orgError("CompanyRepository.setSessionCap", error);
    },
  };
}
