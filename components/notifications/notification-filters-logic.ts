import { rangeToInstants } from "@/components/history/time-zone";
import { isValidIso, orderRange, type Iso } from "@/components/ui/datepicker-utils";
import { NOTIFICATION_MODULES, NOTIFICATION_PRIORITIES } from "@/core/domain/notification";
import type { ListNotificationsInput } from "@/core/application/use-cases/notifications/list-notifications";

export const PAGE_SIZE = 20;

export const OPERATIONS: Record<string, string> = {
  create: "Creación",
  status_change: "Cambio de estado",
  stock_alert: "Alerta de existencia",
};

export type NotificationFilters = {
  module?: string;
  operation?: string;
  priority?: string;
  read?: "read" | "unread";
  storeId?: string;
  from?: Iso;
  to?: Iso;
  page: number;
};

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
const pick = (list: readonly string[], v: string | undefined) => (v && list.includes(v) ? v : undefined);
const READ_PARAM = { "sin-leer": "unread", leidas: "read" } as const;

export function parseNotificationParams(sp: Params): NotificationFilters {
  const raw = { from: one(sp.desde), to: one(sp.hasta) };
  let from = raw.from && isValidIso(raw.from) ? raw.from : undefined;
  let to = raw.to && isValidIso(raw.to) ? raw.to : undefined;
  if (from && to) ({ from, to } = orderRange(from, to));
  const store = one(sp.tienda);
  const page = Number(one(sp.pagina));
  return {
    module: pick(NOTIFICATION_MODULES, one(sp.modulo)),
    operation: one(sp.operacion) && /^[a-z_]{1,40}$/.test(one(sp.operacion)!) ? one(sp.operacion) : undefined,
    priority: pick(NOTIFICATION_PRIORITIES, one(sp.prioridad)),
    read: READ_PARAM[one(sp.estado) as keyof typeof READ_PARAM],
    storeId: store && /^[0-9a-f-]{36}$/i.test(store) ? store : undefined,
    from,
    to,
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function notificationsQuery(f: NotificationFilters): string {
  const q = new URLSearchParams();
  if (f.module) q.set("modulo", f.module);
  if (f.operation) q.set("operacion", f.operation);
  if (f.priority) q.set("prioridad", f.priority);
  if (f.read) q.set("estado", f.read === "unread" ? "sin-leer" : "leidas");
  if (f.storeId) q.set("tienda", f.storeId);
  if (f.from) q.set("desde", f.from);
  if (f.to) q.set("hasta", f.to);
  if (f.page > 1) q.set("pagina", String(f.page));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const hasActiveFilters = (f: NotificationFilters) => !!(f.module || f.operation || f.priority || f.read || f.storeId || f.from || f.to);

/** Filters to use-case input; the day range is cut in the user's zone. */
export function toListInput(f: NotificationFilters, tz: string, over: Partial<ListNotificationsInput> = {}): ListNotificationsInput {
  const range = rangeToInstants(f.from, f.to, tz);
  return {
    module: f.module,
    operation: f.operation,
    priority: f.priority,
    read: f.read,
    storeId: f.storeId,
    from: range.from?.toISOString(),
    to: range.to ? new Date(range.to.getTime() - 1).toISOString() : undefined,
    page: f.page,
    pageSize: PAGE_SIZE,
    ...over,
  };
}
