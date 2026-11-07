export const NOTIFICATION_MODULES = ["products", "currencies", "stock", "requests", "orders", "roles", "users", "organization", "system"] as const;
export const NOTIFICATION_PRIORITIES = ["info", "warning", "urgent"] as const;

export type NotificationModule = (typeof NOTIFICATION_MODULES)[number];
export type NotificationPriority = (typeof NOTIFICATION_PRIORITIES)[number];

export interface Notification {
  id: string;
  companyId: string;
  storeId: string | null;
  module: NotificationModule;
  operation: string;
  priority: NotificationPriority;
  title: string;
  body: string;
  link: string | null;
  actorId: string | null;
  createdAt: Date;
  readAt: Date | null;
}
