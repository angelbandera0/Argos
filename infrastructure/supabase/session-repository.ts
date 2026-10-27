import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SessionRepository } from "@/core/application/ports/session-repository";
import { RuleViolation, SessionExpired } from "@/core/domain/errors";

function fail(op: string, error: { code?: string; message?: string }): never {
  if (error.message?.includes("STORE_NOT_OPERATIONAL")) throw new RuleViolation("STORE_UNAVAILABLE");
  throw new Error(`SessionRepository.${op} failed (${error.code ?? "unknown"})`);
}

/** started_at is the database clock (the insert grant only allows session_id and user_id). */
export function makeSessionRepository(client: SupabaseClient): SessionRepository {
  return {
    async start({ sessionId, userId }) {
      const { error } = await client.from("app_sessions").insert({ session_id: sessionId, user_id: userId });
      if (error) fail("start", error);
    },

    async setActiveStore(sessionId, storeId) {
      const { data, error } = await client
        .from("app_sessions")
        .update({ active_store_id: storeId })
        .eq("session_id", sessionId)
        .is("ended_at", null)
        .select("session_id");
      if (error) fail("setActiveStore", error);
      if (data.length === 0) throw new SessionExpired();
    },

    async end(sessionId) {
      const { error } = await client
        .from("app_sessions")
        .update({ ended_at: new Date().toISOString() })
        .eq("session_id", sessionId)
        .is("ended_at", null);
      if (error) fail("end", error);
    },

    async get(sessionId) {
      const { data, error } = await client
        .from("app_sessions")
        .select("session_id, user_id, started_at, active_store_id, ended_at")
        .eq("session_id", sessionId)
        .maybeSingle();
      if (error) fail("get", error);
      if (!data) return null;
      return {
        sessionId: data.session_id,
        userId: data.user_id,
        startedAt: new Date(data.started_at),
        activeStoreId: data.active_store_id,
        endedAt: data.ended_at ? new Date(data.ended_at) : null,
      };
    },
  };
}
