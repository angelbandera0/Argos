import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type AuthEventEntry,
  type HistoryEntry,
  type HistoryPage,
  type HistoryReader,
} from "@/core/application/ports/history-reader";
import { stripSensitive } from "@/core/application/use-cases/history/sanitize";

type AuditRow = {
  id: string;
  module: string;
  entity_type: string;
  entity_id: string;
  action: HistoryEntry["action"];
  actor_id: string | null;
  store_id: string | null;
  channel: HistoryEntry["channel"];
  before: unknown;
  after: unknown;
  created_at: string;
};
type EventRow = {
  id: string;
  user_id: string | null;
  username_attempted: string | null;
  event: AuthEventEntry["event"];
  actor_id: string | null;
  channel: AuthEventEntry["channel"];
  created_at: string;
};

const AUDIT_COLS = "id, module, entity_type, entity_id, action, actor_id, store_id, channel, before, after, created_at";
const EVENT_COLS = "id, user_id, username_attempted, event, actor_id, channel, created_at";
const NO_ROWS = { items: [], nextCursor: null };

const normalizeTs = (ts: string) => new Date(ts).toISOString() === ts ? ts : ts.replace("+00:00", "Z");

function encodeCursor(row: { created_at: string; id: string }): string {
  return Buffer.from(JSON.stringify([normalizeTs(row.created_at), row.id])).toString("base64url");
}

function keysetFilter(cursor: string): string {
  let t: unknown;
  let id: unknown;
  try {
    [t, id] = JSON.parse(Buffer.from(cursor, "base64url").toString());
  } catch {
    throw new Error("invalid history cursor");
  }
  const ts = /^[0-9TZ:.+-]{10,40}$/;
  if (typeof t !== "string" || typeof id !== "string" || !ts.test(t) || !/^[0-9a-f-]{36}$/.test(id)) {
    throw new Error("invalid history cursor");
  }
  return `created_at.lt."${t}",and(created_at.eq."${t}",id.lt.${id})`;
}

const pageSize = (limit?: number) => Math.min(Math.max(Math.trunc(limit ?? DEFAULT_PAGE_SIZE), 1), MAX_PAGE_SIZE);

function paginate<R extends { created_at: string; id: string }, T>(rows: R[], size: number, map: (r: R) => T): HistoryPage<T> {
  const page = rows.slice(0, size);
  return { items: page.map(map), nextCursor: rows.length > size ? encodeCursor(page[page.length - 1]) : null };
}

export function makeHistoryReader(supabase: SupabaseClient): HistoryReader {
  return {
    async list(i) {
      const size = pageSize(i.limit);
      let q = supabase.from("audit_log").select(AUDIT_COLS);
      if (i.companyId) q = q.eq("company_id", i.companyId);
      if (i.module) q = q.eq("module", i.module);
      if (i.actorId) q = q.eq("actor_id", i.actorId);
      if (i.from) q = q.gte("created_at", i.from.toISOString());
      if (i.to) q = q.lte("created_at", i.to.toISOString());
      if (i.cursor) q = q.or(keysetFilter(i.cursor));
      const { data, error } = await q.order("created_at", { ascending: false }).order("id", { ascending: false }).limit(size + 1);
      if (error) throw new Error(`list history failed (${error.code ?? "unknown"})`);
      return paginate(data as AuditRow[], size, (r) => ({
        id: r.id,
        module: r.module,
        entityType: r.entity_type,
        entityId: r.entity_id,
        action: r.action,
        actorId: r.actor_id,
        storeId: r.store_id,
        channel: r.channel,
        before: stripSensitive(r.before),
        after: stripSensitive(r.after),
        createdAt: new Date(r.created_at),
      }));
    },

    async listAuthEvents(i) {
      const size = pageSize(i.limit);
      let q = supabase.from("auth_events").select(EVENT_COLS);
      if (i.companyId) {
        const { data: users, error: uerr } = await supabase.from("profiles").select("id").eq("company_id", i.companyId);
        if (uerr) throw new Error(`list auth events failed (${uerr.code ?? "unknown"})`);
        if (!users?.length) return NO_ROWS;
        q = q.in("user_id", users.map((u) => u.id));
      }
      if (i.cursor) q = q.or(keysetFilter(i.cursor));
      const { data, error } = await q.order("created_at", { ascending: false }).order("id", { ascending: false }).limit(size + 1);
      if (error) throw new Error(`list auth events failed (${error.code ?? "unknown"})`);
      return paginate(data as EventRow[], size, (r) => ({
        id: r.id,
        userId: r.user_id,
        usernameAttempted: r.username_attempted,
        event: r.event,
        actorId: r.actor_id,
        channel: r.channel,
        createdAt: new Date(r.created_at),
      }));
    },
  };
}
