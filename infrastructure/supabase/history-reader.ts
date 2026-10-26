import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  type AuthEventEntry,
  type AuthEventFilter,
  type HistoryFilter,
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
// The PostgREST builder types are too deep to thread through a generic helper; the filters are applied untyped.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Query = any;

function auditFilters<Q>(q: Q, i: HistoryFilter): Q {
  let r: Query = q;
  if (i.companyId) r = r.eq("company_id", i.companyId);
  if (i.module) r = r.eq("module", i.module);
  if (i.modules) r = r.in("module", i.modules);
  if (i.actorId) r = r.eq("actor_id", i.actorId);
  if (i.actions?.length) r = r.in("action", i.actions);
  if (i.channel) r = r.eq("channel", i.channel);
  if (i.from) r = r.gte("created_at", i.from.toISOString());
  if (i.to) r = r.lt("created_at", i.to.toISOString());
  return r as Q;
}

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
  /** Applies the filters; `null` when the company has no users (nothing to match). */
  async function authFilters<Q>(q: Q, i: AuthEventFilter): Promise<{ q: Q } | null> {
    let r: Query = q;
    if (i.companyId) {
      const { data: users, error } = await supabase.from("profiles").select("id").eq("company_id", i.companyId);
      if (error) throw new Error(`list auth events failed (${error.code ?? "unknown"})`);
      if (!users?.length) return null;
      r = r.in("user_id", users.map((u) => u.id));
    }
    if (i.userId) r = r.eq("user_id", i.userId);
    if (i.events?.length) r = r.in("event", i.events);
    if (i.channel) r = r.eq("channel", i.channel);
    if (i.from) r = r.gte("created_at", i.from.toISOString());
    if (i.to) r = r.lt("created_at", i.to.toISOString());
    return { q: r as Q };
  }

  return {
    async list(i) {
      const size = pageSize(i.limit);
      let q = auditFilters(supabase.from("audit_log").select(AUDIT_COLS), i);
      if (i.cursor) q = q.or(keysetFilter(i.cursor));
      const { data, error } = await q.order("created_at", { ascending: false }).order("id", { ascending: false }).limit(size + 1);
      if (error) throw new Error(`list history failed (${error.code ?? "unknown"})`);
      return paginate(data as unknown as AuditRow[], size, (r) => ({
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

    async countByModule(i) {
      const entries = await Promise.all(
        i.modules.map(async (m) => {
          const { count, error } = await auditFilters(supabase.from("audit_log").select("id", { count: "exact", head: true }), { ...i, module: m });
          if (error) throw new Error(`count history failed (${error.code ?? "unknown"})`);
          return [m, count ?? 0] as const;
        }),
      );
      return Object.fromEntries(entries);
    },

    async listAuthEvents(i) {
      const size = pageSize(i.limit);
      const scoped = await authFilters(supabase.from("auth_events").select(EVENT_COLS), i);
      if (!scoped) return NO_ROWS;
      let q = scoped.q;
      if (i.cursor) q = q.or(keysetFilter(i.cursor));
      const { data, error } = await q.order("created_at", { ascending: false }).order("id", { ascending: false }).limit(size + 1);
      if (error) throw new Error(`list auth events failed (${error.code ?? "unknown"})`);
      return paginate(data as unknown as EventRow[], size, (r) => ({
        id: r.id,
        userId: r.user_id,
        usernameAttempted: r.username_attempted,
        event: r.event,
        actorId: r.actor_id,
        channel: r.channel,
        createdAt: new Date(r.created_at),
      }));
    },

    async countAuthEvents(i) {
      const scoped = await authFilters(supabase.from("auth_events").select("id", { count: "exact", head: true }), i);
      if (!scoped) return 0;
      const { count, error } = await scoped.q;
      if (error) throw new Error(`count auth events failed (${error.code ?? "unknown"})`);
      return count ?? 0;
    },
  };
}
