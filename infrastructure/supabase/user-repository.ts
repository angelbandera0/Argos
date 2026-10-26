import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Assignment, Profile, UserRepository } from "@/core/application/ports/user-repository";
import { Forbidden, RuleViolation } from "@/core/domain/errors";

const COLUMNS = "id, kind, username, display_name, company_id, status, must_change_password";

type Row = {
  id: string;
  kind: Profile["kind"];
  username: string | null;
  display_name: string;
  company_id: string | null;
  status: Profile["status"];
  must_change_password: boolean;
};

const toProfile = (r: Row): Profile => ({
  id: r.id,
  kind: r.kind,
  username: r.username,
  displayName: r.display_name,
  companyId: r.company_id,
  status: r.status,
  mustChangePassword: r.must_change_password,
});

function fail(op: string, error: { code?: string; message?: string }): never {
  if (error.code === "42501") throw new Forbidden();
  if (error.message?.includes("ROLE_EXCLUDED")) throw new RuleViolation("ROLE_EXCLUDED");
  throw new Error(`UserRepository.${op} failed (${error.code ?? "unknown"})`);
}

export function makeUserRepository(client: SupabaseClient): UserRepository {
  return {
    async getProfile(userId) {
      const { data, error } = await client
        .from("profiles")
        .select(COLUMNS)
        .eq("id", userId)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) fail("getProfile", error);
      return data ? toProfile(data as Row) : null;
    },

    async findByUsername(username) {
      const { data, error } = await client
        .from("profiles")
        .select(COLUMNS)
        .eq("username", username.trim().toLowerCase())
        .maybeSingle();
      if (error) fail("findByUsername", error);
      return data ? toProfile(data as Row) : null;
    },

    async listForCompany(companyId) {
      const { data, error } = await client
        .from("profiles")
        .select(COLUMNS)
        .eq("company_id", companyId)
        .eq("kind", "operator")
        .is("deleted_at", null)
        .order("username");
      if (error) fail("listForCompany", error);
      return (data as Row[]).map(toProfile);
    },

    async listAdmins() {
      const { data, error } = await client
        .from("profiles")
        .select(COLUMNS)
        .eq("kind", "admin")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) fail("listAdmins", error);
      return (data as Row[]).map(toProfile);
    },

    async setStatus(userId, status) {
      const { error } = await client.rpc("set_operator_status", { p_user: userId, p_status: status });
      if (error) fail("setStatus", error);
    },

    async assignStores(userId, assignments) {
      const { error } = await client.rpc("assign_user_stores", {
        p_user: userId,
        p_assignments: assignments.map((a) => ({ store_id: a.storeId, role_id: a.roleId })),
      });
      if (error) fail("assignStores", error);
    },

    async listAssignments(userId): Promise<Assignment[]> {
      const { data, error } = await client
        .from("user_stores")
        .select("user_id, store_id, role_id")
        .eq("user_id", userId);
      if (error) fail("listAssignments", error);
      return (data as { user_id: string; store_id: string; role_id: string }[]).map((r) => ({
        userId: r.user_id,
        storeId: r.store_id,
        roleId: r.role_id,
      }));
    },
  };
}
