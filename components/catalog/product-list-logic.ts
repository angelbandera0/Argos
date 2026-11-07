export type StatusFilter = "todos" | "activos" | "inactivos";

export const PAGE_SIZE = 10;

export const parseStatus = (v: unknown): StatusFilter => (v === "activos" || v === "inactivos" ? v : "todos");

/** Legacy URLs used `estado=activo|inactivo`. */
export const parseStatusParam = (v: unknown): StatusFilter =>
  v === "activo" ? "activos" : v === "inactivo" ? "inactivos" : parseStatus(v);

export const matchesStatus = (f: StatusFilter, active: boolean) => f === "todos" || (f === "activos") === active;

export function statusCounts(items: { active: boolean }[]): Record<StatusFilter, number> {
  const activos = items.filter((p) => p.active).length;
  return { todos: items.length, activos, inactivos: items.length - activos };
}

export const matchesQuery = (p: { name: string; description: string | null }, query: string) => {
  const q = query.trim().toLowerCase();
  return !q || p.name.toLowerCase().includes(q) || (p.description ?? "").toLowerCase().includes(q);
};

export function productListQuery(p: { q?: string; categoria?: string; estado?: StatusFilter; pagina?: number }): string {
  const sp = new URLSearchParams();
  if (p.q) sp.set("q", p.q);
  if (p.categoria) sp.set("categoria", p.categoria);
  if (p.estado && p.estado !== "todos") sp.set("estado", p.estado);
  if (p.pagina && p.pagina > 1) sp.set("pagina", String(p.pagina));
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export const selectedLabel = (n: number) => (n === 1 ? "1 producto seleccionado" : `${n} productos seleccionados`);

export type BulkOp = "activate" | "deactivate" | "category";

export function bulkSummary(done: number, failed: number): string {
  const ok = done === 1 ? "1 producto actualizado" : `${done} productos actualizados`;
  return failed ? `${ok}; ${failed} no se pudieron actualizar.` : `${ok}.`;
}
