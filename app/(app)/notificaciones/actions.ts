"use server";

import { notFound } from "next/navigation";
import type { Actor } from "@/core/domain/actor";
import { readClaims } from "@/infrastructure/supabase/claims";
import { makeNotifications } from "@/infrastructure/supabase/notifications-factory";
import { createServerClient } from "@/infrastructure/supabase/server-client";
import type { NotificationItem } from "@/components/notifications/notification-logic";

async function requireNotifications() {
  const supabase = await createServerClient();
  const claims = await readClaims(supabase);
  if (!claims) notFound();
  const actor: Actor = { userId: claims.userId, kind: claims.kind, channel: "ui" };
  return { actor, ...makeNotifications(supabase) };
}

export async function listRecentAction(limit = 10): Promise<NotificationItem[]> {
  const { actor, listNotifications } = await requireNotifications();
  const { items } = await listNotifications(actor, { pageSize: limit });
  return items.map((n) => ({
    id: n.id,
    module: n.module,
    priority: n.priority,
    title: n.title,
    body: n.body,
    link: n.link,
    createdAt: n.createdAt.toISOString(),
    read: n.readAt !== null,
  }));
}

export async function countUnreadAction(): Promise<number> {
  const { actor, countUnreadNotifications } = await requireNotifications();
  return countUnreadNotifications(actor);
}

export async function markReadAction(ids?: string[]): Promise<number> {
  const { actor, markNotificationsRead } = await requireNotifications();
  return markNotificationsRead(actor, { ids });
}
