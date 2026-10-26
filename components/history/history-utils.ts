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
  update: { label: "Edición", variant: "new" },
  deactivate: { label: "Desactivación", variant: "warning" },
  reactivate: { label: "Reactivación", variant: "neutral" },
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

export type HistoryFilters = { actor?: string; from?: string; to?: string; cursor?: string };
type Params = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);
const isDay = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));

export function parseFilters(sp: Params): HistoryFilters {
  const actor = one(sp.usuario);
  const from = one(sp.desde);
  const to = one(sp.hasta);
  const cursor = one(sp.cursor);
  return {
    actor: actor && /^[0-9a-f-]{36}$/i.test(actor) ? actor : undefined,
    from: isDay(from) ? from : undefined,
    to: isDay(to) ? to : undefined,
    cursor: cursor && cursor.length <= 300 && /^[\w-]+$/.test(cursor) ? cursor : undefined,
  };
}

/** searchParams for a link; `cursor` replaces the current one (undefined = first page). */
export function filtersQuery(f: HistoryFilters, cursor?: string): string {
  const q = new URLSearchParams();
  if (f.actor) q.set("usuario", f.actor);
  if (f.from) q.set("desde", f.from);
  if (f.to) q.set("hasta", f.to);
  if (cursor) q.set("cursor", cursor);
  const s = q.toString();
  return s ? `?${s}` : "";
}

/** Whole days, in UTC (server zone); `to` is inclusive. */
export function dateBounds(f: HistoryFilters): { from?: Date; to?: Date } {
  return {
    from: f.from ? new Date(`${f.from}T00:00:00.000Z`) : undefined,
    to: f.to ? new Date(`${f.to}T23:59:59.999Z`) : undefined,
  };
}
