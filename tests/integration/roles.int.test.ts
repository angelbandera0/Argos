import { createHmac, randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createAdminClient } from "@/infrastructure/supabase/admin-client";
import { makeAuthGateway, makeMfaGateway } from "@/infrastructure/supabase/auth-gateway";
import { makeCompanyRepository } from "@/infrastructure/supabase/company-repository";
import { makeRoleRepository } from "@/infrastructure/supabase/role-repository";

const admin = createAdminClient();
const gateway = makeAuthGateway(admin);
const run = randomBytes(3).toString("hex");
const userIds: string[] = [];
const companyIds: string[] = [];

function totp(secret: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const ch of secret.replace(/=+$/, "").toUpperCase()) bits += alphabet.indexOf(ch).toString(2).padStart(5, "0");
  const key = Buffer.from(bits.match(/.{8}/g)!.map((b) => parseInt(b, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const h = createHmac("sha1", key).update(counter).digest();
  const o = h[h.length - 1] & 0xf;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

async function aal2Admin(tag: string): Promise<{ id: string; client: SupabaseClient }> {
  const email = `itest-t25-${run}-${tag}@example.com`;
  const created = await gateway.createAdminUser({ email, displayName: `itest t25 ${tag}` });
  userIds.push(created.userId);
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signed = await client.auth.signInWithPassword({ email, password: created.temporaryPassword });
  expect(signed.error).toBeNull();
  const mfa = makeMfaGateway(client);
  const { factorId, secret } = await mfa.enrollTotp();
  await mfa.verifyTotp({ code: totp(secret), factorId });
  return { id: created.userId, client };
}

let a: Awaited<ReturnType<typeof aal2Admin>>;
let b: Awaited<ReturnType<typeof aal2Admin>>;
let companyId: string;

beforeAll(async () => {
  a = await aal2Admin("a");
  b = await aal2Admin("b");
  const c = await makeCompanyRepository(a.client).create({ name: `itest-t25-${run}`, founderId: a.id });
  companyIds.push(c.id);
  companyId = c.id;
});

afterAll(async () => {
  const ids = [a?.id, b?.id].filter(Boolean) as string[];
  if (ids.length) {
    const del = await admin.from("role_company_exclusions").delete().in("role_id", (await admin.from("roles").select("id").in("owner_id", ids)).data?.map((r) => r.id) ?? []);
    expect(del.error).toBeNull();
    const rids = (await admin.from("roles").select("id").in("owner_id", ids)).data?.map((r) => r.id) ?? [];
    await admin.from("role_permissions").delete().in("role_id", rids);
    await admin.from("roles").delete().in("id", rids);
  }
  for (const id of companyIds) {
    const { error } = await admin.rpc("delete_test_company", { p_company: id });
    expect(error).toBeNull();
  }
  for (const id of userIds) {
    const factors = await admin.auth.admin.mfa.listFactors({ userId: id });
    for (const f of factors.data?.factors ?? []) await admin.auth.admin.mfa.deleteFactor({ id: f.id, userId: id });
    await admin.auth.admin.deleteUser(id);
  }
  const companies = await admin.from("companies").select("id").like("name", `itest-t25-${run}%`);
  expect(companies.data).toEqual([]);
  const users = await admin.auth.admin.listUsers({ perPage: 200 });
  expect(users.data.users.filter((u) => u.email?.startsWith(`itest-t25-${run}`))).toEqual([]);
  const roles = await admin.from("roles").select("id").in("owner_id", ids);
  expect(roles.data).toEqual([]);
});

const perms = (view: boolean, create = false) => ({
  products: { view, create, edit: false, delete: false },
});

describe("role repository", () => {
  it("returns the created role with permissions and exclusions; another admin does not see it", async () => {
    const repo = makeRoleRepository(a.client);
    const role = await repo.create({
      ownerId: a.id,
      name: `itest-t25-${run} Ventas`,
      sessionSeconds: 3600,
      excludedCompanyIds: [companyId],
      permissions: perms(true, true),
    });
    expect(role).toMatchObject({ ownerId: a.id, sessionSeconds: 3600, excludedCompanyIds: [companyId], permissions: perms(true, true) });
    expect(await repo.getById(role.id)).toEqual(role);
    expect((await repo.listByOwner(a.id)).map((r) => r.id)).toContain(role.id);

    const other = makeRoleRepository(b.client);
    expect(await other.getById(role.id)).toBeNull();
    expect(await other.listByOwner(a.id)).toEqual([]);
    expect((await other.listByOwner(b.id)).some((r) => r.id === role.id)).toBe(false);

    const updated = await repo.update(role.id, { permissions: perms(true), excludedCompanyIds: [] });
    expect(updated.permissions).toEqual(perms(true));
    expect(updated.excludedCompanyIds).toEqual([]);
  });

  it("rejects a repeated name (case and spaces ignored) and a create without view", async () => {
    const repo = makeRoleRepository(a.client);
    const base = { ownerId: a.id, sessionSeconds: null, excludedCompanyIds: [], permissions: perms(true) };
    await expect(repo.create({ ...base, name: `  ITEST-T25-${run} ventas ` })).rejects.toMatchObject({ code: "NAME_TAKEN" });
    await expect(repo.create({ ...base, name: `itest-t25-${run} bad`, permissions: perms(false, true) })).rejects.toMatchObject({
      code: "PERMISSION_REQUIRES_VIEW",
    });
    expect((await repo.listByOwner(a.id)).some((r) => r.name.endsWith("bad"))).toBe(false);
  });

  it("softDelete frees the name; hasAssignments is false for an unassigned role", async () => {
    const repo = makeRoleRepository(a.client);
    const [role] = await repo.listByOwner(a.id);
    expect(await repo.hasAssignments(role.id)).toBe(false);
    await repo.softDelete(role.id);
    expect(await repo.getById(role.id)).toBeNull();
    const again = await repo.create({ ownerId: a.id, name: role.name, sessionSeconds: null, excludedCompanyIds: [], permissions: perms(true) });
    expect(again.id).not.toBe(role.id);
  });
});
