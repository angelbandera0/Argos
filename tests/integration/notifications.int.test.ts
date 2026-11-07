import { createHmac, randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Actor } from "@/core/domain/actor";
import { createAdminClient } from "@/infrastructure/supabase/admin-client";
import { makeAuthGateway, makeMfaGateway } from "@/infrastructure/supabase/auth-gateway";
import { makeCompanyRepository } from "@/infrastructure/supabase/company-repository";
import { makeNotifications } from "@/infrastructure/supabase/notifications-factory";

const admin = createAdminClient();
const gateway = makeAuthGateway(admin);
const run = randomBytes(3).toString("hex");
const userIds: string[] = [];
let companyId: string;
type Ctx = { id: string; client: SupabaseClient; actor: Actor };
let a: Ctx;
let b: Ctx;

function totp(secret: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const ch of secret.replace(/=+$/, "").toUpperCase()) bits += alphabet.indexOf(ch).toString(2).padStart(5, "0");
  const key = Buffer.from(bits.match(/.{8}/g)!.map((x) => parseInt(x, 2)));
  const counter = Buffer.alloc(8);
  counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30_000)));
  const h = createHmac("sha1", key).update(counter).digest();
  const o = h[h.length - 1] & 0xf;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

async function newAdmin(tag: string): Promise<Ctx> {
  const email = `itest-t06-${tag}-${run}@example.com`;
  const created = await gateway.createAdminUser({ email, displayName: `itest t06 ${tag}` });
  userIds.push(created.userId);
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  expect((await client.auth.signInWithPassword({ email, password: created.temporaryPassword })).error).toBeNull();
  const mfa = makeMfaGateway(client);
  const { factorId, secret } = await mfa.enrollTotp();
  await mfa.verifyTotp({ code: totp(secret), factorId });
  return { id: created.userId, client, actor: { userId: created.userId, kind: "admin", channel: "ui" } };
}

const seed = (recipient: string, module: string, priority: string, title: string, readAt: string | null = null) => ({
  company_id: companyId,
  recipient_id: recipient,
  module,
  operation: "itest",
  priority,
  title: `itest-${title}`,
  body: "",
  read_at: readAt,
});

beforeAll(async () => {
  a = await newAdmin("a");
  b = await newAdmin("b");
  companyId = (await makeCompanyRepository(a.client).create({ name: `itest-t06-${run}`, founderId: a.id })).id;
  const { error } = await admin.from("notifications").insert([
    seed(a.id, "stock", "urgent", "a1"),
    seed(a.id, "orders", "info", "a2"),
    seed(a.id, "stock", "warning", "a3", new Date().toISOString()),
    seed(b.id, "stock", "urgent", "b1"),
  ]);
  expect(error).toBeNull();
});

afterAll(async () => {
  if (companyId) {
    await admin.from("notifications").delete().eq("company_id", companyId);
    const { error } = await admin.rpc("delete_test_company", { p_company: companyId });
    expect(error).toBeNull();
  }
  for (const id of userIds) {
    const factors = await admin.auth.admin.mfa.listFactors({ userId: id });
    for (const f of factors.data?.factors ?? []) await admin.auth.admin.mfa.deleteFactor({ id: f.id, userId: id });
    await admin.auth.admin.deleteUser(id);
  }
});

describe("notifications repository (REQ-011)", () => {
  it("lists only the caller's, filters, counts and marks read", async () => {
    const svc = makeNotifications(a.client);
    const titles = async (f: object = {}) => (await svc.listNotifications(a.actor, f)).items.map((n) => n.title.slice(6)).sort();

    expect(await titles()).toEqual(["a1", "a2", "a3"]);
    expect(await titles({ module: "stock" })).toEqual(["a1", "a3"]);
    expect(await titles({ priority: "info" })).toEqual(["a2"]);
    expect(await titles({ read: "read" })).toEqual(["a3"]);
    expect(await titles({ read: "unread", module: "stock" })).toEqual(["a1"]);
    expect((await svc.listNotifications(a.actor, { pageSize: 1 })).total).toBe(3);
    expect(await svc.countUnreadNotifications(a.actor)).toBe(2);

    const a1 = (await svc.listNotifications(a.actor, { priority: "urgent" })).items[0];
    expect(await svc.markNotificationsRead(a.actor, { ids: [a1.id] })).toBe(1);
    expect(await svc.countUnreadNotifications(a.actor)).toBe(1);
    expect(await svc.markNotificationsRead(a.actor)).toBe(1);
    expect(await svc.countUnreadNotifications(a.actor)).toBe(0);
  });

  it("another user sees and changes none of them", async () => {
    const svc = makeNotifications(b.client);
    expect((await svc.listNotifications(b.actor)).items.map((n) => n.title)).toEqual(["itest-b1"]);
    const [a2] = (await admin.from("notifications").select("id").eq("recipient_id", a.id).eq("title", "itest-a2")).data!;
    expect(await svc.markNotificationsRead(b.actor, { ids: [a2.id] })).toBe(0);
    expect(await svc.countUnreadNotifications(b.actor)).toBe(1);
  });
});
