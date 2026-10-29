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
