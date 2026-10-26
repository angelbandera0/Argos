import { createHmac, randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { RuleViolation } from "@/core/domain/errors";
import { createAdminClient } from "@/infrastructure/supabase/admin-client";
import { makeAuthGateway, makeMfaGateway } from "@/infrastructure/supabase/auth-gateway";
import { makeCompanyRepository } from "@/infrastructure/supabase/company-repository";
import { makeSiteRepository } from "@/infrastructure/supabase/site-repository";
import { makeStoreRepository } from "@/infrastructure/supabase/store-repository";
import { makeUnitStatusRepository } from "@/infrastructure/supabase/unit-status-repository";

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
  const email = `itest-t23-${run}-${tag}@example.com`;
  const created = await gateway.createAdminUser({ email, displayName: `itest t23 ${tag}` });
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

beforeAll(async () => {
  a = await aal2Admin("a");
  b = await aal2Admin("b");
});

afterAll(async () => {
  for (const id of companyIds) {
    const { error } = await admin.rpc("delete_test_company", { p_company: id });
    expect(error).toBeNull();
  }
  for (const id of userIds) {
    const factors = await admin.auth.admin.mfa.listFactors({ userId: id });
    for (const f of factors.data?.factors ?? []) await admin.auth.admin.mfa.deleteFactor({ id: f.id, userId: id });
    await admin.auth.admin.deleteUser(id);
  }
  const companies = await admin.from("companies").select("id").like("name", `itest-t23-${run}%`);
  expect(companies.data).toEqual([]);
  const users = await admin.auth.admin.listUsers({ perPage: 200 });
  expect(users.data.users.filter((u) => u.email?.startsWith(`itest-t23-${run}`))).toEqual([]);
});

describe("organization repositories", () => {
  it("an admin creates a company and sees its code; another admin without access does not", async () => {
    const created = await makeCompanyRepository(a.client).create({ name: `itest-t23-${run}`, founderId: a.id });
    companyIds.push(created.id);
    expect(created.code).toMatch(/^[a-z0-9]{4}$/);
    expect(created.founderId).toBe(a.id);

    const mine = await makeCompanyRepository(a.client).listForActor({ userId: a.id, kind: "admin", channel: "ui" });
    expect(mine.find((c) => c.id === created.id)?.code).toBe(created.code);
    expect(await makeCompanyRepository(a.client).listAdmins(created.id)).toEqual([a.id]);

    const theirs = await makeCompanyRepository(b.client).listForActor({ userId: b.id, kind: "admin", channel: "ui" });
    expect(theirs.some((c) => c.id === created.id)).toBe(false);
    expect(await makeCompanyRepository(b.client).getById(created.id)).toBeNull();
  });

  it("grants and revokes access; the founder cannot be revoked", async () => {
    const companies = makeCompanyRepository(a.client);
    const companyId = companyIds[0];
    await companies.grantAccess(companyId, b.id, a.id);
    expect((await makeCompanyRepository(b.client).getById(companyId))?.id).toBe(companyId);
    await companies.revokeAccess(companyId, b.id);
    expect(await makeCompanyRepository(b.client).getById(companyId)).toBeNull();
    await expect(companies.revokeAccess(companyId, a.id)).rejects.toMatchObject({ code: "FOUNDER_PROTECTED" });
  });

  it("deactivating with reason otro and no text fails in the database, even calling the repository directly", async () => {
    const companyId = companyIds[0];
    const sites = makeSiteRepository(a.client);
    const stores = makeStoreRepository(a.client);
    const units = makeUnitStatusRepository(a.client);
    const site = await sites.create({ companyId, name: "itest site" });
    const store = await stores.create({ companyId, siteId: site.id, name: "itest store" });
    expect(await units.getCompanyId("store", store.id)).toBe(companyId);

    await expect(units.setStatus("store", store.id, "inactive", { code: "otro", text: "  " }, a.id)).rejects.toBeInstanceOf(RuleViolation);
    expect((await stores.getById(store.id))?.status).toBe("active");

    await units.setStatus("store", store.id, "inactive", { code: "cierre-temporal" }, a.id);
    expect((await stores.getById(store.id))?.status).toBe("inactive");
    await units.setStatus("store", store.id, "active", null, a.id);

    expect(await units.hasData("site", site.id)).toBe(true);
    await expect(units.softDelete("site", site.id)).rejects.toMatchObject({ code: "HAS_DATA" });
  });

  it("history gets create and deactivate rows with the right actor", async () => {
    const companyId = companyIds[0];
    const units = makeUnitStatusRepository(a.client);
    await units.setStatus("company", companyId, "inactive", { code: "cierre-temporal" }, a.id);
    const { data } = await admin
      .from("audit_log")
      .select("action, actor_id, entity_type")
      .eq("entity_id", companyId)
      .eq("entity_type", "companies");
    const rows = data ?? [];
    expect(rows.find((r) => r.action === "create")?.actor_id).toBe(a.id);
    expect(rows.find((r) => r.action === "deactivate")?.actor_id).toBe(a.id);
  });
});
