import "server-only";
import { notFound } from "next/navigation";
import type { Actor } from "@/core/domain/actor";
import type { Notification } from "@/core/domain/notification";
import type { NotificationItem } from "@/components/notifications/notification-logic";
import { readClaims } from "@/infrastructure/supabase/claims";
import { makeNotifications } from "@/infrastructure/supabase/notifications-factory";
import { createServerClient } from "@/infrastructure/supabase/server-client";

/** Any authenticated user; notifications are always the actor's own (RLS). */
export async function requireNotifications() {
  const supabase = await createServerClient();
  const claims = await readClaims(supabase);
  if (!claims) notFound();
  const actor: Actor = { userId: claims.userId, kind: claims.kind, channel: "ui" };
  return { actor, supabase, ...makeNotifications(supabase) };
}

export const toItem = (n: Notification): NotificationItem => ({
  id: n.id,
  module: n.module,
  priority: n.priority,
  title: n.title,
  body: n.body,
  link: n.link,
  storeId: n.storeId,
  createdAt: n.createdAt.toISOString(),
  read: n.readAt !== null,
});
