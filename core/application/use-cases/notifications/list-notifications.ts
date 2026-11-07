import type { NotificationRepository } from "@/core/application/ports/notification-repository";
import type { Actor } from "@/core/domain/actor";
import { RuleViolation } from "@/core/domain/errors";
import { NOTIFICATION_MODULES, NOTIFICATION_PRIORITIES, type Notification } from "@/core/domain/notification";

export interface ListNotificationsInput {
  module?: string;
  operation?: string;
  priority?: string;
  read?: string;
  storeId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_PAGE_SIZE = 100;

const invalid = (): never => {
  throw new RuleViolation("INVALID_INPUT");
};
const oneOf = <T extends string>(list: readonly T[], v: string | undefined): T | undefined =>
  v === undefined ? undefined : (list as readonly string[]).includes(v) ? (v as T) : invalid();

function date(v: string | undefined, endOfDay: boolean): Date | undefined {
  if (v === undefined) return undefined;
  const d = new Date(endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T23:59:59.999Z` : v);
  return Number.isNaN(d.getTime()) ? invalid() : d;
}

export function makeListNotifications(deps: { notifications: NotificationRepository }) {
  return async (actor: Actor, input: ListNotificationsInput = {}): Promise<{ items: Notification[]; total: number }> => {
    const page = input.page ?? 1;
    const pageSize = Math.min(input.pageSize ?? 20, MAX_PAGE_SIZE);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1) invalid();
    if (input.storeId !== undefined && !UUID.test(input.storeId)) invalid();
    const read = input.read === undefined ? undefined : oneOf(["read", "unread"], input.read);
    return deps.notifications.list(
      actor.userId,
      {
        module: oneOf(NOTIFICATION_MODULES, input.module),
        operation: input.operation,
        priority: oneOf(NOTIFICATION_PRIORITIES, input.priority),
        read,
        storeId: input.storeId,
        from: date(input.from, false),
        to: date(input.to, true),
      },
      { offset: (page - 1) * pageSize, limit: pageSize },
    );
  };
}
