import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Role, RoleRepository } from "@/core/application/ports/role-repository";
import { Forbidden, RuleViolation } from "@/core/domain/errors";
import type { Module, PermissionSet } from "@/core/domain/permissions";

const SELECT =
  "id, owner_id, name, session_seconds, role_permissions(module, can_view, can_create, can_edit, can_delete), role_company_exclusions(company_id)";

type Row = {
  id: string;
  owner_id: string;
  name: string;
  session_seconds: number | null;
  role_permissions: { module: Module; can_view: boolean; can_create: boolean; can_edit: boolean; can_delete: boolean }[];
  role_company_exclusions: { company_id: string }[];
};

const none: PermissionSet = { view: false, create: false, edit: false, delete: false };

const toRole = (r: Row): Role => ({
  id: r.id,
  ownerId: r.owner_id,
  name: r.name,
  sessionSeconds: r.session_seconds,
  excludedCompanyIds: r.role_company_exclusions.map((e) => e.company_id),
  permissions: {
    products: { ...none },
    ...Object.fromEntries(
      r.role_permissions.map((p) => [
        p.module,
        { view: p.can_view, create: p.can_create, edit: p.can_edit, delete: p.can_delete },
      ]),
    ),
  } as Role["permissions"],
});

function roleError(op: string, error: { code?: string; message?: string }): never {
  if (error.code === "23505") throw new RuleViolation("NAME_TAKEN");
  if (error.code === "23514" && (error.message ?? "").includes("role_permissions")) {
    throw new RuleViolation("PERMISSION_REQUIRES_VIEW");
  }
  if (error.code === "42501") throw new Forbidden();
  throw new Error(`${op} failed (${error.code ?? "unknown"})`);
}

export function makeRoleRepository(client: SupabaseClient): RoleRepository {
  async function writePermissions(roleId: string, permissions: Role["permissions"]) {
    const rows = Object.entries(permissions).map(([module, p]) => ({
      role_id: roleId,
      module,
      can_view: p.view,
      can_create: p.create,
      can_edit: p.edit,
      can_delete: p.delete,
    }));
    const { error } = await client.from("role_permissions").upsert(rows);
    if (error) roleError("RoleRepository.permissions", error);
  }

  async function writeExclusions(roleId: string, companyIds: string[]) {
    const del = await client.from("role_company_exclusions").delete().eq("role_id", roleId);
    if (del.error) roleError("RoleRepository.exclusions", del.error);
    if (companyIds.length === 0) return;
    const { error } = await client
      .from("role_company_exclusions")
      .insert(companyIds.map((company_id) => ({ role_id: roleId, company_id })));
    if (error) roleError("RoleRepository.exclusions", error);
  }

  async function load(id: string): Promise<Role> {
    const { data, error } = await client.from("roles").select(SELECT).eq("id", id).is("deleted_at", null).single();
    if (error) roleError("RoleRepository.load", error);
    return toRole(data as unknown as Row);
  }

  return {
    async create(role) {
      const { data, error } = await client
        .from("roles")
        .insert({ owner_id: role.ownerId, name: role.name, session_seconds: role.sessionSeconds })
        .select("id")
        .single();
      if (error) roleError("RoleRepository.create", error);
      const id = (data as { id: string }).id;
      try {
        await writePermissions(id, role.permissions);
        await writeExclusions(id, role.excludedCompanyIds);
      } catch (e) {
        await client.from("roles").update({ deleted_at: new Date().toISOString() }).eq("id", id);
        throw e;
      }
      return load(id);
    },

    async update(id, patch) {
      if (patch.name !== undefined || patch.sessionSeconds !== undefined) {
        const columns: Record<string, unknown> = {};
        if (patch.name !== undefined) columns.name = patch.name;
        if (patch.sessionSeconds !== undefined) columns.session_seconds = patch.sessionSeconds;
        const { error } = await client.from("roles").update(columns).eq("id", id);
        if (error) roleError("RoleRepository.update", error);
      }
      if (patch.permissions) await writePermissions(id, patch.permissions);
      if (patch.excludedCompanyIds) await writeExclusions(id, patch.excludedCompanyIds);
      return load(id);
    },

    async getById(id) {
      const { data, error } = await client.from("roles").select(SELECT).eq("id", id).is("deleted_at", null).maybeSingle();
      if (error) roleError("RoleRepository.getById", error);
      return data ? toRole(data as unknown as Row) : null;
    },

    async listByOwner(ownerId) {
      const { data, error } = await client
        .from("roles")
        .select(SELECT)
        .eq("owner_id", ownerId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });
      if (error) roleError("RoleRepository.listByOwner", error);
      return (data as unknown as Row[]).map(toRole);
    },

    async softDelete(id) {
      const { error } = await client.from("roles").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) roleError("RoleRepository.softDelete", error);
    },

    async hasAssignments(roleId) {
      const { count, error } = await client
        .from("user_stores")
        .select("user_id", { count: "exact", head: true })
        .eq("role_id", roleId);
      if (error) roleError("RoleRepository.hasAssignments", error);
      return (count ?? 0) > 0;
    },
  };
}
