import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationRepository } from "@/core/application/ports/notification-repository";
import { Forbidden } from "@/core/domain/errors";
import type { Notification } from "@/core/domain/notification";

type Row = {
  id: string;
  company_id: string;
  store_id: string | null;
  module: Notification["module"];
  operation: string;
  priority: Notification["priority"];
  title: string;
  body: string;
  link: string | null;
  actor_id: string | null;
  created_at: string;
  read_at: string | null;
};

const COLS = "id, company_id, store_id, module, operation, priority, title, body, link, actor_id, created_at, read_at";

const fail = (op: string, error: { code?: string }): never => {
  if (error.code === "42501") throw new Forbidden();
  throw new Error(`${op} failed (${error.code ?? "unknown"})`);
};

export function makeNotificationRepository(supabase: SupabaseClient): NotificationRepository {
  return {
    async list(recipientId, f, page) {
      let q = supabase.from("notifications").select(COLS, { count: "exact" }).eq("recipient_id", recipientId);
      if (f.module) q = q.eq("module", f.module);
      if (f.operation) q = q.eq("operation", f.operation);
      if (f.priority) q = q.eq("priority", f.priority);
      if (f.read) q = f.read === "read" ? q.not("read_at", "is", null) : q.is("read_at", null);
      if (f.storeId) q = q.eq("store_id", f.storeId);
      if (f.from) q = q.gte("created_at", f.from.toISOString());
      if (f.to) q = q.lte("created_at", f.to.toISOString());
      const { data, count, error } = await q
        .order("created_at", { ascending: false })
        .order("id")
        .range(page.offset, page.offset + page.limit - 1);
      if (error) fail("list notifications", error);
      return {
        total: count ?? 0,
        items: (data as Row[]).map((r) => ({
          id: r.id,
          companyId: r.company_id,
          storeId: r.store_id,
          module: r.module,
          operation: r.operation,
          priority: r.priority,
          title: r.title,
          body: r.body,
          link: r.link,
          actorId: r.actor_id,
          createdAt: new Date(r.created_at),
          readAt: r.read_at ? new Date(r.read_at) : null,
        })),
      };
    },

    async countUnread() {
      const { data, error } = await supabase.rpc("unread_notifications_count");
      if (error) fail("count unread notifications", error);
      return Number(data);
    },

    async markRead(_recipientId, ids) {
      const { data, error } = await supabase.rpc("mark_notifications_read", { p_ids: ids });
      if (error) fail("mark notifications read", error);
      return Number(data);
    },
  };
}
