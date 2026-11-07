import type { NotificationRepository } from "@/core/application/ports/notification-repository";
import type { Actor } from "@/core/domain/actor";

export function makeCountUnreadNotifications(deps: { notifications: NotificationRepository }) {
  return (actor: Actor): Promise<number> => deps.notifications.countUnread(actor.userId);
}
