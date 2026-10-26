import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { StoreOption } from "@/core/application/ports/store-access-reader";
import { AuthFailed } from "@/core/domain/errors";
import { normalizeUsername } from "@/core/domain/username";
import { createAdminClient } from "./admin-client";
import { makeUserRepository } from "./user-repository";
import { makeUsers } from "./users-factory";

const BAN = "876000h";

/** Returns null for any failure so callers answer identically (unknown user, locked, wrong PIN). The PIN is never logged or stored. */
export async function enterWithPinFlow(
  supabase: SupabaseClient,
  input: { username: string; pin: string },
  admin: SupabaseClient = createAdminClient(),
): Promise<{ userId: string; sessionId: string; stores: StoreOption[] } | null> {
  const username = normalizeUsername(input.username);
  const profile = await makeUserRepository(admin).findByUsername(username);
  if (!profile || profile.kind !== "operator" || profile.status !== "active") return null;

  const users = makeUsers(supabase);
  try {
    const result = await users.loginWithPin({ username, pin: input.pin });
    await admin.rpc("reset_pin_failures", { p_user_id: profile.id });
    await admin.from("auth_events").insert({ user_id: profile.id, event: "login_ok", channel: "ui" });
    return result;
  } catch (e) {
    if (!(e instanceof AuthFailed)) {
      await users.auth.revokeSessions(profile.id).catch(() => {});
      throw e;
    }
    const failure = await admin.rpc("register_pin_failure", { p_username: username });
    if (failure.data?.locked === true) {
      await admin.auth.admin.updateUserById(profile.id, { ban_duration: BAN });
    }
    return null;
  }
}
