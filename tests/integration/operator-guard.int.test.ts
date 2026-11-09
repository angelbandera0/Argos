import { createHmac, randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { requireOperatorStore } from "@/core/application/use-cases/access/assert-session-active";
import type { Actor } from "@/core/domain/actor";
import { hasSpecial } from "@/core/domain/permissions";
import { createAdminClient } from "@/infrastructure/supabase/admin-client";
import { makeAuthGateway, makeMfaGateway } from "@/infrastructure/supabase/auth-gateway";
import { readClaims } from "@/infrastructure/supabase/claims";
import { makeCompanyRepository } from "@/infrastructure/supabase/company-repository";
import { enterWithPinFlow } from "@/infrastructure/supabase/pin-login";
import { makeRoleRepository } from "@/infrastructure/supabase/role-repository";
import { makeSessionRepository } from "@/infrastructure/supabase/session-repository";
import { makeSiteRepository } from "@/infrastructure/supabase/site-repository";
import { makeStoreAccessReader } from "@/infrastructure/supabase/store-access-reader";
import { makeStoreRepository } from "@/infrastructure/supabase/store-repository";
import { makeUsers } from "@/infrastructure/supabase/users-factory";

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

const admin = createAdminClient();
const run = randomBytes(3).toString("hex");
const fresh = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

let adminId: string;
let operatorId: string;
let companyId: string;
let admClient: SupabaseClient;

beforeAll(async () => {
  const gateway = makeAuthGateway(admin);
  const created = await gateway.createAdminUser({ email: `itest-guard-${run}@example.com`, displayName: "itest guard" });
  adminId = created.userId;
  admClient = fresh();
  await admClient.auth.signInWithPassword({ email: `itest-guard-${run}@example.com`, password: created.temporaryPassword });
  const mfa = makeMfaGateway(admClient);
  const { factorId, secret } = await mfa.enrollTotp();
  await mfa.verifyTotp({ code: totp(secret), factorId });
  const actor: Actor = { userId: adminId, kind: "admin", channel: "ui" };
  companyId = (await makeCompanyRepository(admClient).create({ name: `itest-guard-${run}`, founderId: adminId })).id;
  const site = await makeSiteRepository(admClient).create({ companyId, name: `itest-guard-${run} sede` });
  const store = await makeStoreRepository(admClient).create({ companyId, siteId: site.id, name: "Tienda" });
  const role = await makeRoleRepository(admClient).create({
    ownerId: adminId,
    name: `itest-guard-${run} Jefe`,
    sessionSeconds: null,
    excludedCompanyIds: [],
    permissions: { products: { view: true, create: false, edit: false, delete: false } },
    specialPermissions: [{ permission: "request_replenishment", warehouse: false }],
  });
  const op = await makeUsers(admClient).createOperator(actor, {
    companyId,
    name: `itest${run}g`,
    displayName: "itest guard op",
    roleId: role.id,
    storeIds: [store.id],
  });
  operatorId = op.userId;
  (globalThis as { __g?: unknown }).__g = { username: op.username, pin: op.pin, storeId: store.id };
});

afterAll(async () => {
  await admin.from("app_sessions").delete().eq("user_id", operatorId);
  await admin.from("user_stores").delete().eq("company_id", companyId);
  await admin.auth.admin.deleteUser(operatorId);
  const rids = ((await admin.from("roles").select("id").eq("owner_id", adminId)).data ?? []).map((r) => r.id);
  if (rids.length) {
    await admin.from("role_company_exclusions").delete().in("role_id", rids);
    await admin.from("role_permissions").delete().in("role_id", rids);
    await admin.from("roles").delete().in("id", rids);
  }
  await admin.rpc("delete_test_company", { p_company: companyId });
  const f = await admin.auth.admin.mfa.listFactors({ userId: adminId });
  for (const x of f.data?.factors ?? []) await admin.auth.admin.mfa.deleteFactor({ id: x.id, userId: adminId });
  await admin.auth.admin.deleteUser(adminId);
});

describe("operator guard path (requireStockUser)", () => {
  it("claims -> session -> store access -> special permission", async () => {
    const g = (globalThis as unknown as { __g: { username: string; pin: string; storeId: string } }).__g;
    const client = fresh();
    const entered = await enterWithPinFlow(client, { username: g.username, pin: g.pin });
    expect(entered).not.toBeNull();
    const users = makeUsers(client);
    let claims = (await readClaims(client))!;
    expect(claims.sessionId).toBe(entered!.sessionId);
    const actor: Actor = { userId: claims.userId, kind: "operator", channel: "ui", sessionId: claims.sessionId! };
    await users.chooseStore(actor, { storeId: g.storeId });
    claims = (await readClaims(client))!;
    const { store } = await requireOperatorStore(
      { sessions: makeSessionRepository(client), access: makeStoreAccessReader(client), clock: { now: () => new Date() } },
      actor,
    );
    expect(store.storeId).toBe(g.storeId);
    expect(hasSpecial(store, "request_replenishment")).toBe(true);
  });
});
