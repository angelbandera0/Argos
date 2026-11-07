import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { WriteOffReason, WriteOffReasonRepository } from "@/core/application/ports/write-off-reason-repository";
import { Forbidden } from "@/core/domain/errors";
import { stockError } from "./stock-errors";

type Row = { id: string; company_id: string; code: string; name: string; active: boolean; standard: boolean; requires_text: boolean };
const COLS = "id, company_id, code, name, active, standard, requires_text";

const toReason = (r: Row): WriteOffReason => ({
  id: r.id,
  companyId: r.company_id,
  code: r.code,
  name: r.name,
  active: r.active,
  standard: r.standard,
  requiresText: r.requires_text,
});

export function makeWriteOffReasonRepository(supabase: SupabaseClient): WriteOffReasonRepository {
  async function updateOne(id: string, patch: Record<string, unknown>) {
    const { data, error } = await supabase.from("write_off_reasons").update(patch).eq("id", id).is("deleted_at", null).select("id");
    if (error) stockError("update write-off reason", error);
    if (!data?.length) throw new Forbidden();
  }

  return {
    async list(companyId) {
      const { data, error } = await supabase
        .from("write_off_reasons")
        .select(COLS)
        .eq("company_id", companyId)
        .is("deleted_at", null)
        .order("name")
        .order("id");
      if (error) stockError("list write-off reasons", error);
      return (data as Row[]).map(toReason);
    },
    async get(id) {
      const { data, error } = await supabase.from("write_off_reasons").select(COLS).eq("id", id).is("deleted_at", null).maybeSingle();
      if (error) stockError("get write-off reason", error);
      return data ? toReason(data as Row) : null;
    },
    async create(companyId, i) {
      const { data, error } = await supabase
        .from("write_off_reasons")
        .insert({ company_id: companyId, code: i.code, name: i.name, active: true })
        .select(COLS)
        .single();
      if (error) stockError("create write-off reason", error);
      return toReason(data as Row);
    },
    rename: (id, name) => updateOne(id, { name }),
    setActive: (id, active) => updateOne(id, { active }),
    delete: (id) => updateOne(id, { deleted_at: new Date().toISOString() }),
  };
}
