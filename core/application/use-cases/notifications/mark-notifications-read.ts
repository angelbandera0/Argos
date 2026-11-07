import type { NotificationRepository } from "@/core/application/ports/notification-repository";
import type { Actor } from "@/core/domain/actor";
import { RuleViolation } from "@/core/domain/errors";
import { UUID } from "./list-notifications";

export function makeMarkNotificationsRead(deps: { notifications: NotificationRepository }) {
  return async (actor: Actor, input: { ids?: string[] } = {}): Promise<number> => {
    if (input.ids && !input.ids.every((id) => UUID.test(id))) throw new RuleViolation("INVALID_INPUT");
    return deps.notifications.markRead(actor.userId, input.ids ?? null);
  };
}
