import type { NavIconName } from "@/components/icons";
import { isValidIso, orderRange, type Iso } from "@/components/ui/datepicker-utils";
import type { BadgeVariant } from "@/components/ui/feedback-utils";
import { stripSensitive } from "@/core/application/use-cases/history/sanitize";

/** Single module -> label map. audit_log records products, roles, users and organization; only products has role permissions today. */
export const HISTORY_MODULES: Record<string, string> = {
  products: "Productos",
  roles: "Roles",
  users: "Usuarios",
  organization: "Organización",
};

export const ENTITY_LABELS: Record<string, string> = {
  products: "Producto",
  categories: "Categoría",
  roles: "Rol",
  role_permissions: "Permisos de rol",
  role_company_exclusions: "Exclusión de rol",
  profiles: "Usuario",
  user_stores: "Asignación de tienda",
  companies: "Compañía",
  sites: "Sede",
  stores: "Tienda",
};

export const ACTIONS: Record<string, { label: string; variant: BadgeVariant }> = {
  create: { label: "Creación", variant: "success" },
  update: { label: "Edición", variant: "warning" },
  deactivate: { label: "Desactivación", variant: "danger" },
  reactivate: { label: "Reactivación", variant: "success" },
  delete: { label: "Eliminación", variant: "danger" },
};

export const CHANNELS: Record<string, string> = {
  ui: "Web",
  api: "API",
  app: "App",
  mcp: "MCP",
  system: "Sistema",
};

export const AUTH_EVENTS: Record<string, { label: string; variant: BadgeVariant }> = {
  login_ok: { label: "Inicio de sesión", variant: "success" },
  login_failed: { label: "Intento fallido", variant: "warning" },
  locked: { label: "Bloqueo", variant: "danger" },
  unlocked: { label: "Desbloqueo", variant: "neutral" },
  pin_reset: { label: "PIN restablecido", variant: "new" },
  password_changed: { label: "Contraseña cambiada", variant: "new" },
};

export const CHANNEL_ICONS: Record<string, NavIconName> = {
  ui: "Monitor",
  app: "Smartphone",
  api: "Plug",
  mcp: "Bot",
  system: "Settings",
};

export const ACTION_KEYS = Object.keys(ACTIONS);
export const AUTH_EVENT_KEYS = Object.keys(AUTH_EVENTS);

export const actionInfo = (a: string) => ACTIONS[a] ?? { label: a, variant: "neutral" as const };
export const channelLabel = (c: string) => CHANNELS[c] ?? c;

export type FieldChange = { field: string; before: unknown; after: unknown };

const asRecord = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

/** Updates list only the fields that changed; create/delete list the whole object. Sensitive keys never come out. */
export function diffFields(action: string, before: unknown, after: unknown): FieldChange[] {
  const b = asRecord(stripSensitive(before));
  const a = asRecord(stripSensitive(after));
  const whole = action === "create" || action === "delete";
  return [...new Set([...Object.keys(b), ...Object.keys(a)])]
    .sort()
    .filter((k) => whole || JSON.stringify(b[k]) !== JSON.stringify(a[k]))
    .map((field) => ({ field, before: b[field], after: a[field] }));
}

const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/;

export function formatValue(v: unknown, timeZone?: string): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Sí" : "No";
  if (typeof v === "string" && ISO.test(v) && !Number.isNaN(Date.parse(v))) {
    return new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short", timeZone }).format(new Date(v));
  }
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export type HistoryFilters = {
  actor?: string;
  actions: string[];
  channel?: string;
  from?: Iso;
  to?: Iso;
  cursor?: string;
  /** Cursors of the pages already visited ("~" = first page), oldest first. */
  prev: string[];
};
type Params = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
const CURSOR = /^[\w-]{1,300}$/;

/** searchParams -> filters. Invalid dates are dropped (`invalidDates`); a reversed range is swapped. */
export function parseHistoryParams(sp: Params, actionKeys: string[]): { filters: HistoryFilters; invalidDates: boolean } {
  const actor = one(sp.usuario);
  const channel = one(sp.canal);
  const cursor = one(sp.cursor);
  const raw = { from: one(sp.desde) || undefined, to: one(sp.hasta) || undefined };
  let from = raw.from && isValidIso(raw.from) ? raw.from : undefined;
  let to = raw.to && isValidIso(raw.to) ? raw.to : undefined;
  const invalidDates = (!!raw.from && !from) || (!!raw.to && !to);
  if (from && to) ({ from, to } = orderRange(from, to));
  const actions = (one(sp.accion) ?? "").split(",").filter((a) => actionKeys.includes(a));
  const prev = (one(sp.prev) ?? "").split(".").filter((c) => c === "~" || CURSOR.test(c)).slice(-20);
  return {
    invalidDates,
    filters: {
      actor: actor && /^[0-9a-f-]{36}$/i.test(actor) ? actor : undefined,
      actions: [...new Set(actions)],
      channel: channel && channel in CHANNELS ? channel : undefined,
      from,
      to,
      cursor: cursor && CURSOR.test(cursor) ? cursor : undefined,
      prev,
    },
  };
}

/** searchParams for a link; `over` replaces fields (cursor/prev default to the first page). */
export function filtersQuery(f: Partial<HistoryFilters>, over: { cursor?: string; prev?: string[] } = {}): string {
  const q = new URLSearchParams();
  if (f.actor) q.set("usuario", f.actor);
  if (f.actions?.length) q.set("accion", f.actions.join(","));
  if (f.channel) q.set("canal", f.channel);
  if (f.from) q.set("desde", f.from);
  if (f.to) q.set("hasta", f.to);
  if (over.cursor) q.set("cursor", over.cursor);
  if (over.prev?.length) q.set("prev", over.prev.join("."));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export const hasActiveFilters = (f: HistoryFilters) => !!(f.actor || f.actions.length || f.channel || f.from || f.to);

/** Back/forward links of the cursor stack: `prev` is the visited pages, `next` appends the current one. */
export function pageLinks(f: HistoryFilters, nextCursor: string | null) {
  const last = f.prev[f.prev.length - 1];
  return {
    page: f.prev.length + 1,
    prev: last === undefined ? null : { cursor: last === "~" ? undefined : last, prev: f.prev.slice(0, -1) },
    next: nextCursor ? { cursor: nextCursor, prev: [...f.prev, f.cursor ?? "~"] } : null,
  };
}

/** Best-effort display name of the entity from its snapshots. */
export function entityName(before: unknown, after: unknown): string | undefined {
  for (const snap of [after, before]) {
    const r = asRecord(stripSensitive(snap));
    for (const k of ["name", "display_name", "username", "code"]) {
      if (typeof r[k] === "string" && r[k]) return r[k] as string;
    }
  }
  return undefined;
}
