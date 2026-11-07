import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { StoreAccess, StoreAccessReader } from "@/core/application/ports/store-access-reader";
import { MODULES, type PermissionMap, type PermissionSet } from "@/core/domain/permissions";

type Row = {
  store_id: string;
  store_name: string;
  site_name: string;
  company_id: string;
  role_id: string;
  role_name: string;
  role_session_seconds: number | null;
  company_cap_seconds: number;
  operational: boolean;
  permissions: Partial<Record<string, Partial<PermissionSet>>>;
};

const flags = (p?: Partial<PermissionSet>): PermissionSet => ({ view: p?.view ?? false, create: p?.create ?? false, edit: p?.edit ?? false, delete: p?.delete ?? false });

const toPermissions = (raw: Row["permissions"]) =>
  Object.fromEntries(MODULES.map((m) => [m, flags(raw[m])])) as PermissionMap & { products: PermissionSet };

const toAccess = (r: Row): StoreAccess => ({
  storeId: r.store_id,
  storeName: r.store_name,
  siteName: r.site_name,
  companyId: r.company_id,
  roleId: r.role_id,
  roleName: r.role_name,
  roleSessionSeconds: r.role_session_seconds,
  companyCapSeconds: r.company_cap_seconds,
  operational: r.operational,
  permissions: toPermissions(r.permissions),
});

/** The SQL function reads as the signed-in operator (auth.uid()); the userId argument must match that client. */
export function makeStoreAccessReader(client: SupabaseClient): StoreAccessReader {
  async function read(userId: string, storeId: string | null): Promise<StoreAccess[]> {
    const { data: claims } = await client.auth.getClaims();
    if (claims?.claims.sub !== userId) return [];
    const { data, error } = await client.rpc("my_store_access", { p_store: storeId });
    if (error) throw new Error(`StoreAccessReader failed (${error.code ?? "unknown"})`);
    return (data as Row[]).map(toAccess);
  }

  return {
    listStoreAccess: (userId) => read(userId, null),
    async getStoreAccess(userId, storeId) {
      return (await read(userId, storeId))[0] ?? null;
    },
  };
}
