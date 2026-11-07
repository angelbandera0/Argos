import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { makeCountUnreadNotifications } from "@/core/application/use-cases/notifications/count-unread-notifications";
import { makeListNotifications } from "@/core/application/use-cases/notifications/list-notifications";
import { makeMarkNotificationsRead } from "@/core/application/use-cases/notifications/mark-notifications-read";
import { makeNotificationRepository } from "./notification-repository";

/** Notification use cases bound to one request's user client (RLS applies). */
export function makeNotifications(supabase: SupabaseClient) {
  const deps = { notifications: makeNotificationRepository(supabase) };
  return {
    listNotifications: makeListNotifications(deps),
    countUnreadNotifications: makeCountUnreadNotifications(deps),
    markNotificationsRead: makeMarkNotificationsRead(deps),
  };
}
