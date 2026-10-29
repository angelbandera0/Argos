export type UserState = "active" | "never" | "locked" | "inactive";
export type StateFilter = "todos" | "activos" | "bloqueados" | "inactivos";

export const PAGE_SIZE = 10;

export function userState(status: "active" | "locked" | "deactivated", lastLogin: Date | null): UserState {
  if (status === "deactivated") return "inactive";
  if (status === "locked") return "locked";
  return lastLogin ? "active" : "never";
}

const FILTER_STATES: Record<StateFilter, (s: UserState) => boolean> = {
  todos: () => true,
  activos: (s) => s === "active" || s === "never",
  bloqueados: (s) => s === "locked",
  inactivos: (s) => s === "inactive",
};

export const matchesState = (filter: StateFilter, state: UserState) => FILTER_STATES[filter](state);

export function parseState(value: unknown): StateFilter {
  return typeof value === "string" && value in FILTER_STATES ? (value as StateFilter) : "todos";
}

export function parsePage(value: unknown): number {
  const n = typeof value === "string" ? Number.parseInt(value, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function parseOption(value: unknown, valid: string[]): string {
  return typeof value === "string" && valid.includes(value) ? value : "";
}

/** «Hoy, 08:12» · «Ayer, 18:05» · «12 oct» · «Nunca». Days are cut in the given time zone. */
export function lastAccessLabel(at: Date | null, now: Date, timeZone = "UTC"): string {
  if (!at) return "Nunca";
  const day = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone }).format(d);
  const time = new Intl.DateTimeFormat("es", { timeZone, hour: "2-digit", minute: "2-digit", hour12: false }).format(at);
  if (day(at) === day(now)) return `Hoy, ${time}`;
  if (day(at) === day(new Date(now.getTime() - 86_400_000))) return `Ayer, ${time}`;
  return new Intl.DateTimeFormat("es", { timeZone, day: "numeric", month: "short" }).format(at).replace(".", "");
}

/** All active stores → «Todas las tiendas»; otherwise the first one plus «+N». */
export function storesSummary(names: string[], totalStores: number): { all: boolean; first?: string; more: number } {
  if (names.length > 1 && names.length >= totalStores) return { all: true, more: 0 };
  return { all: false, first: names[0], more: Math.max(0, names.length - 1) };
}

export function userListQuery(p: { q?: string; rol?: string; tienda?: string; estado?: StateFilter; pagina?: number }): string {
  const sp = new URLSearchParams();
  if (p.q) sp.set("q", p.q);
  if (p.rol) sp.set("rol", p.rol);
  if (p.tienda) sp.set("tienda", p.tienda);
  if (p.estado && p.estado !== "todos") sp.set("estado", p.estado);
  if (p.pagina && p.pagina > 1) sp.set("pagina", String(p.pagina));
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}
