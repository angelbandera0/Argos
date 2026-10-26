import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile, UserRepository } from "@/core/application/ports/user-repository";

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

export function makeUserRepository(
  client: SupabaseClient,
): Pick<UserRepository, "getProfile" | "listAdmins"> {
  return {
    async getProfile(userId) {
      const { data, error } = await client
        .from("profiles")
        .select(COLUMNS)
        .eq("id", userId)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw new Error(`UserRepository.getProfile failed (${error.code ?? "unknown"})`);
      return data ? toProfile(data as Row) : null;
    },

    async listAdmins() {
      const { data, error } = await client
        .from("profiles")
        .select(COLUMNS)
        .eq("kind", "admin")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw new Error(`UserRepository.listAdmins failed (${error.code ?? "unknown"})`);
      return (data as Row[]).map(toProfile);
    },
  };
}
