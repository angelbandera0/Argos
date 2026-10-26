import { randomBytes } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { makeEnsureSuperadmin } from "@/core/application/use-cases/access/ensure-superadmin";
import { createAdminClient } from "@/infrastructure/supabase/admin-client";
import { makeAuthGateway } from "@/infrastructure/supabase/auth-gateway";

const admin = createAdminClient();
const ensure = makeEnsureSuperadmin({ auth: makeAuthGateway(admin) });
const email = `itest-${randomBytes(3).toString("hex")}@example.com`;
const initialPassword = randomBytes(18).toString("base64url");

async function superadmins() {
  const { data, error } = await admin.from("profiles").select("id, must_change_password").eq("kind", "superadmin");
  expect(error).toBeNull();
  return data ?? [];
}

describe("ensureSuperadmin (cloud project)", () => {
  const before = superadmins();

  afterAll(async () => {
    if ((await before).length > 0) return;
    const rows = await superadmins();
    for (const r of rows) {
      await admin.from("profiles").delete().eq("id", r.id);
      await admin.auth.admin.deleteUser(r.id);
    }
    const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
    for (const u of data?.users.filter((u) => u.email === email) ?? []) {
      await admin.auth.admin.deleteUser(u.id);
    }
    expect(await superadmins()).toHaveLength(0);
  });

  it("five concurrent calls leave exactly one superadmin", async () => {
    const existing = await before;
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () => ensure({ email, initialPassword })),
    );
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    const created = results.filter((r) => r.status === "fulfilled" && r.value.created).length;
    const rows = await superadmins();
    expect(rows).toHaveLength(1);
    if (existing.length > 0) {
      expect(created).toBe(0);
      expect(rows[0].id).toBe(existing[0].id);
      return;
    }
    expect(created).toBe(1);
    expect(rows[0].must_change_password).toBe(true);
    expect(await ensure({ email, initialPassword })).toEqual({ created: false });
  });
});
