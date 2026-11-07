import { createHmac, randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Actor } from "@/core/domain/actor";
import { createAdminClient } from "@/infrastructure/supabase/admin-client";
import { makeAuthGateway, makeMfaGateway } from "@/infrastructure/supabase/auth-gateway";
import { makeCompanyRepository } from "@/infrastructure/supabase/company-repository";
import { makeCurrencies } from "@/infrastructure/supabase/currencies-factory";

const admin = createAdminClient();
const gateway = makeAuthGateway(admin);
const run = randomBytes(3).toString("hex");
let adminId: string;
let companyId: string;
let client: SupabaseClient;
let actor: Actor;

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

beforeAll(async () => {
  const email = `itest-t02-${run}@example.com`;
  const created = await gateway.createAdminUser({ email, displayName: "itest t02" });
  adminId = created.userId;
  client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  expect((await client.auth.signInWithPassword({ email, password: created.temporaryPassword })).error).toBeNull();
  const mfa = makeMfaGateway(client);
  const { factorId, secret } = await mfa.enrollTotp();
  await mfa.verifyTotp({ code: totp(secret), factorId });
  actor = { userId: adminId, kind: "admin", channel: "ui" };
  companyId = (await makeCompanyRepository(client).create({ name: `itest-t02-${run}`, founderId: adminId })).id;
});

afterAll(async () => {
  if (companyId) {
    await admin.from("currency_denominations").delete().eq("company_id", companyId);
    await admin.from("currencies").delete().eq("company_id", companyId);
    const { error } = await admin.rpc("delete_test_company", { p_company: companyId });
    expect(error).toBeNull();
  }
  if (adminId) {
    const factors = await admin.auth.admin.mfa.listFactors({ userId: adminId });
    for (const f of factors.data?.factors ?? []) await admin.auth.admin.mfa.deleteFactor({ id: f.id, userId: adminId });
    await admin.auth.admin.deleteUser(adminId);
  }
  expect((await admin.from("companies").select("id").like("name", `itest-t02-${run}%`)).data).toEqual([]);
});

describe("currencies repository (REQ-010)", () => {
  it("creates, rejects a repeated code, keeps one default, deactivates and deletes", async () => {
    const svc = makeCurrencies(client);
    const mxn = await svc.createCurrency(actor, {
      companyId,
      code: "MXN",
      name: "Peso mexicano",
      symbol: "$",
      decimals: 2,
      isDefault: true,
    });
    expect(mxn).toMatchObject({ code: "MXN", isDefault: true, active: true });
    await expect(
      svc.createCurrency(actor, { companyId, code: " mxn ", name: "Otro", symbol: "$", decimals: 2 }),
    ).rejects.toMatchObject({ code: "CODE_TAKEN" });

    const usd = await svc.createCurrency(actor, { companyId, code: "USD", name: "Dólar", symbol: "US$", decimals: 2 });
    await svc.updateCurrency(actor, { id: usd.id, isDefault: true });
    const all = await svc.listCurrencies(actor, { companyId });
    expect(all.filter((c) => c.isDefault).map((c) => c.code)).toEqual(["USD"]);

    await svc.setCurrencyActive(actor, { id: mxn.id, active: false });
    expect((await svc.listCurrencies(actor, { companyId, active: true })).map((c) => c.code)).toEqual(["USD"]);
    expect((await svc.listCurrencies(actor, { companyId, active: false, search: "peso" })).map((c) => c.code)).toEqual(["MXN"]);

    await svc.deleteCurrency(actor, { id: mxn.id });
    expect((await svc.listCurrencies(actor, { companyId })).map((c) => c.code)).toEqual(["USD"]);
    await expect(svc.getCurrency(actor, { id: mxn.id })).rejects.toMatchObject({ name: "NotFound" });
  });

  it("denominations: ordered by value, repeated value rejected, deactivate", async () => {
    const svc = makeCurrencies(client);
    const [usd] = await svc.listCurrencies(actor, { companyId });
    await svc.addDenomination(actor, { currencyId: usd.id, value: 20, kind: "bill" });
    const quarter = await svc.addDenomination(actor, { currencyId: usd.id, value: 0.25, kind: "coin" });
    await expect(svc.addDenomination(actor, { currencyId: usd.id, value: 20, kind: "coin" })).rejects.toMatchObject({
      code: "VALUE_TAKEN",
    });
    await svc.setDenominationActive(actor, { id: quarter.id, active: false });
    const got = await svc.getCurrency(actor, { id: usd.id });
    expect(got.denominations.map((d) => [d.value, d.kind, d.active])).toEqual([
      [0.25, "coin", false],
      [20, "bill", true],
    ]);
    await svc.deleteDenomination(actor, { id: quarter.id });
    expect((await svc.getCurrency(actor, { id: usd.id })).denominations).toHaveLength(1);
  });
});
