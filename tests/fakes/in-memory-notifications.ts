import type { NotificationFilters, NotificationRepository } from "@/core/application/ports/notification-repository";
import type { Notification } from "@/core/domain/notification";

export class InMemoryNotifications implements NotificationRepository {
  readonly rows = new Map<string, Notification>();
  readonly recipients = new Map<string, string>();
  lastFilters?: NotificationFilters;

  add(recipientId: string, n: Partial<Notification> & { id: string }): void {
    this.rows.set(n.id, {
      companyId: "c1",
      storeId: null,
      module: "stock",
      operation: "low_stock",
      priority: "info",
      title: "t",
      body: "b",
      link: null,
      actorId: null,
      createdAt: new Date(),
      readAt: null,
      ...n,
    });
    this.recipients.set(n.id, recipientId);
  }

  private mine(recipientId: string) {
    return [...this.rows.values()].filter((n) => this.recipients.get(n.id) === recipientId);
  }

  async list(recipientId: string, f: NotificationFilters, page: { offset: number; limit: number }) {
    this.lastFilters = f;
    const all = this.mine(recipientId)
      .filter((n) => (!f.module || n.module === f.module) && (!f.priority || n.priority === f.priority))
      .filter((n) => !f.read || (f.read === "read") === (n.readAt !== null))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return { items: all.slice(page.offset, page.offset + page.limit), total: all.length };
  }

  async countUnread(recipientId: string) {
    return this.mine(recipientId).filter((n) => !n.readAt).length;
  }

  async markRead(recipientId: string, ids: string[] | null) {
    const target = this.mine(recipientId).filter((n) => !n.readAt && (!ids || ids.includes(n.id)));
    for (const n of target) n.readAt = new Date();
    return target.length;
  }
}
