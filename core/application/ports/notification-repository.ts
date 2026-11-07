import type { Notification, NotificationModule, NotificationPriority } from "@/core/domain/notification";

export interface NotificationFilters {
  module?: NotificationModule;
  operation?: string;
  priority?: NotificationPriority;
  read?: "read" | "unread";
  storeId?: string;
  from?: Date;
  to?: Date;
}

/** Every method acts on the recipient's own notifications only. Newest first. */
export interface NotificationRepository {
  list(recipientId: string, filters: NotificationFilters, page: { offset: number; limit: number }): Promise<{ items: Notification[]; total: number }>;
  countUnread(recipientId: string): Promise<number>;
  /** ids null marks every unread notification; returns how many changed. */
  markRead(recipientId: string, ids: string[] | null): Promise<number>;
}
