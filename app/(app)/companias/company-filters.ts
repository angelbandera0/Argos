export type StatusFilter = "todas" | "activas" | "inactivas";
type Filterable = { name: string; code: string; status: "active" | "inactive" };

export const parseStatus = (v: unknown): StatusFilter => (v === "activas" || v === "inactivas" ? v : "todas");

export function filterCompanies<T extends Filterable>(all: T[], q: string, status: StatusFilter): T[] {
  const query = q.trim().toLowerCase();
  return all.filter(
    (c) =>
      (status === "todas" || (status === "activas") === (c.status === "active")) &&
      (c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query)),
  );
}

export function statusCounts(all: Filterable[], q: string): Record<StatusFilter, number> {
  const base = filterCompanies(all, q, "todas");
  const activas = base.filter((c) => c.status === "active").length;
  return { todas: base.length, activas, inactivas: base.length - activas };
}

export type SortKey = "nombre" | "codigo" | "estado";
export const PAGE_SIZE = 6;

export const parseSort = (v: unknown): SortKey => (v === "codigo" || v === "estado" ? v : "nombre");
export const parsePage = (v: unknown): number => {
  const n = typeof v === "string" ? Number.parseInt(v, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
};

export function sortCompanies<T extends Filterable>(rows: T[], sort: SortKey): T[] {
  const byName = (a: T, b: T) => a.name.localeCompare(b.name, "es");
  const cmp: Record<SortKey, (a: T, b: T) => number> = {
    nombre: byName,
    codigo: (a, b) => a.code.localeCompare(b.code) || byName(a, b),
    estado: (a, b) => Number(b.status === "active") - Number(a.status === "active") || byName(a, b),
  };
  return [...rows].sort(cmp[sort]);
}

export function pageSlice<T>(rows: T[], page: number, size = PAGE_SIZE): { items: T[]; page: number } {
  const last = Math.max(1, Math.ceil(rows.length / size));
  const p = Math.min(page, last);
  return { items: rows.slice((p - 1) * size, p * size), page: p };
}
