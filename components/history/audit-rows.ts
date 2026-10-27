import type { AuthEventEntry, HistoryEntry } from "@/core/application/ports/history-reader";
import type { AuditRowData } from "@/components/ui/audit-table";
import { AUTH_EVENTS, CHANNEL_ICONS, ENTITY_LABELS, HISTORY_MODULES, actionInfo, channelLabel, diffFields, entityName, formatValue } from "./history-utils";

const channel = (key: string) => ({ key, label: channelLabel(key), icon: CHANNEL_ICONS[key] ?? ("Monitor" as const) });

export function toAuditRow(e: HistoryEntry, names: Map<string, string>, tz: string): AuditRowData {
  const changes = diffFields(e.action, e.before, e.after).map((c) => ({
    field: c.field,
    before: formatValue(c.before, tz),
    after: formatValue(c.after, tz),
  }));
  return {
    id: e.id,
    createdAt: e.createdAt.toISOString(),
    actor: e.actorId ? (names.get(e.actorId) ?? "Usuario") : null,
    action: actionInfo(e.action),
    module: HISTORY_MODULES[e.module] ?? e.module,
    entity: { type: ENTITY_LABELS[e.entityType] ?? e.entityType, name: entityName(e.before, e.after), id: e.entityId },
    channel: channel(e.channel),
    changes: changes.length ? changes : undefined,
  };
}

export function toAuthRow(e: AuthEventEntry, names: Map<string, string>): AuditRowData {
  return {
    id: e.id,
    createdAt: e.createdAt.toISOString(),
    actor: (e.userId && names.get(e.userId)) || e.usernameAttempted || "—",
    action: AUTH_EVENTS[e.event] ?? { label: e.event, variant: "neutral" },
    channel: channel(e.channel),
  };
}
