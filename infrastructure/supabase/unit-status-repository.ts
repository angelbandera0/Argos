import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Level } from "@/core/application/ports/company-repository";
import type { UnitStatusRepository } from "@/core/application/ports/unit-status-repository";
import { NotFound } from "@/core/domain/errors";
import { orgError } from "@/infrastructure/supabase/org-errors";

const TABLE = { company: "companies", site: "sites", store: "stores" } as const;

export function makeUnitStatusRepository(client: SupabaseClient): UnitStatusRepository {
  async function exists(table: string, column: string, id: string, extra?: string) {
    let q = client.from(table).select("id", { count: "exact", head: true }).eq(column, id);
    if (extra) q = q.is(extra, null);
    const { count, error } = await q;
    if (error) orgError("UnitStatusRepository.hasData", error);
    return (count ?? 0) > 0;
  }

  return {
    async getCompanyId(level, id) {
      const column = level === "company" ? "id" : "company_id";
      const { data, error } = await client
        .from(TABLE[level])
        .select(column)
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) orgError("UnitStatusRepository.getCompanyId", error);
      return data ? ((data as unknown as Record<string, string>)[column] ?? null) : null;
    },

    async setStatus(level, id, status, reason) {
      const { data, error } = await client
        .from(TABLE[level])
        .update({
          status,
          status_reason_code: status === "inactive" ? (reason?.code ?? null) : null,
          status_reason_text: status === "inactive" ? (reason?.text ?? null) : null,
        })
        .eq("id", id)
        .select("id");
      if (error) orgError("UnitStatusRepository.setStatus", error);
      if (data.length === 0) throw new NotFound();
    },

    async softDelete(level, id) {
      const { data, error } = await client
        .from(TABLE[level])
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id)
        .select("id");
      if (error) orgError("UnitStatusRepository.softDelete", error);
      if (data.length === 0) throw new NotFound();
    },

    // app.has_data is not executable by authenticated; same rule via RLS-filtered reads.
    // The soft-delete trigger still enforces HAS_DATA in the database.
    async hasData(level: Level, id) {
      if (level === "site") return exists("stores", "site_id", id, "deleted_at");
      if (level === "store") return exists("user_stores", "store_id", id);
      return (
        (await exists("sites", "company_id", id, "deleted_at")) ||
        (await exists("profiles", "company_id", id, "deleted_at")) ||
        (await exists("categories", "company_id", id, "deleted_at")) ||
        (await exists("products", "company_id", id, "deleted_at"))
      );
    },
  };
}
