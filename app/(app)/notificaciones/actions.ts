"use server";

import type { NotificationItem } from "@/components/notifications/notification-logic";
import { requireNotifications, toItem } from "./guard";

export async function listRecentAction(limit = 10): Promise<NotificationItem[]> {
  const { actor, listNotifications } = await requireNotifications();
  const { items } = await listNotifications(actor, { pageSize: limit });
  return items.map(toItem);
}

export async function countUnreadAction(): Promise<number> {
  const { actor, countUnreadNotifications } = await requireNotifications();
  return countUnreadNotifications(actor);
}

export async function markReadAction(ids?: string[]): Promise<number> {
  const { actor, markNotificationsRead } = await requireNotifications();
  return markNotificationsRead(actor, { ids });
}
