import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { afterAll, describe, expect, it } from "vitest";
import { makeCreateAdmin } from "@/core/application/use-cases/access/create-admin";
import { makeListAdmins } from "@/core/application/use-cases/access/list-admins";
import type { Actor } from "@/core/domain/actor";
import { Forbidden } from "@/core/domain/errors";
import { createAdminClient } from "@/infrastructure/supabase/admin-client";
import { makeAuthGateway } from "@/infrastructure/supabase/auth-gateway";
import { makeUserRepository } from "@/infrastructure/supabase/user-repository";

const admin = createAdminClient();
const run = randomBytes(3).toString("hex");
const email = `itest-t21-${run}@example.com`;
const createAdmin = makeCreateAdmin({ auth: makeAuthGateway(admin) });
// The service client stands in for the superadmin's RLS view (the real superadmin has no known password).
const listAsSuperadmin = makeListAdmins({ users: makeUserRepository(admin) });
const superadmin: Actor = { userId: "00000000-0000-0000-0000-000000000001", kind: "superadmin", channel: "ui" };
const asAdmin: Actor = { userId: "00000000-0000-0000-0000-000000000002", kind: "admin", channel: "ui" };
let adminId = "";
let password = "";

afterAll(async () => {
  const users = await admin.auth.admin.listUsers({ perPage: 1000 });
  const ids = users.data.users.filter((u) => u.email?.startsWith("itest-t21-")).map((u) => u.id);
  for (const id of ids) await admin.auth.admin.deleteUser(id);
  await admin.from("audit_log").delete().in("entity_id", ids);
  await admin.from("auth_events").delete().in("user_id", ids);
});

describe("superadmin administrators", () => {
  it("the superadmin creates an admin, gets the temporary password and lists it with must_change_password", async () => {
    const created = await createAdmin(superadmin, { email, displayName: "itest t21" });
    adminId = created.adminId;
    password = created.temporaryPassword;
    expect(password.length).toBeGreaterThanOrEqual(12);

    const listed = await listAsSuperadmin(superadmin);
    const mine = listed.find((p) => p.id === adminId);
    expect(mine).toMatchObject({ kind: "admin", displayName: "itest t21", mustChangePassword: true });
    expect(JSON.stringify(listed)).not.toContain(password);

    const { data } = await admin.from("profiles").select("must_change_password").eq("id", adminId).single();
    expect(data?.must_change_password).toBe(true);
  });

  it("the temporary password works once for sign-in and the token carries must_change_password", async () => {
    const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
      auth: { persistSession: false },
    });
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    expect(error).toBeNull();
    expect(data.user?.app_metadata.must_change_password).toBe(true);
    expect((await makeUserRepository(client).getProfile(adminId))?.mustChangePassword).toBe(true);
  });

  it("an admin can neither list nor create administrators", async () => {
    await expect(listAsSuperadmin(asAdmin)).rejects.toBeInstanceOf(Forbidden);
    const other = `itest-t21-${run}-x@example.com`;
    await expect(createAdmin(asAdmin, { email: other, displayName: "x" })).rejects.toBeInstanceOf(Forbidden);
    const users = await admin.auth.admin.listUsers({ perPage: 1000 });
    expect(users.data.users.some((u) => u.email === other)).toBe(false);
  });
});
