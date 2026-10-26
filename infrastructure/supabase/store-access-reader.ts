import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { StoreAccess, StoreAccessReader } from "@/core/application/ports/store-access-reader";
import type { PermissionSet } from "@/core/domain/permissions";

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
  permissions: { products?: Partial<PermissionSet> };
};

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
  permissions: {
    products: {
      view: r.permissions.products?.view ?? false,
      create: r.permissions.products?.create ?? false,
      edit: r.permissions.products?.edit ?? false,
      delete: r.permissions.products?.delete ?? false,
    },
  },
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
