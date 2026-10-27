export type Sort = { id: string; dir: "asc" | "desc" };
type Value = string | number | null | undefined;

export function nextSort(current: Sort | null, id: string): Sort | null {
  if (current?.id !== id) return { id, dir: "asc" };
  return current.dir === "asc" ? { id, dir: "desc" } : null;
}

export function sortRows<T>(rows: T[], getValue: (row: T) => Value, dir: Sort["dir"]): T[] {
  const sign = dir === "asc" ? 1 : -1;
  return rows
    .map((row, i) => ({ row, i, v: getValue(row) }))
    .sort((a, b) => {
      const an = a.v == null;
      const bn = b.v == null;
      if (an || bn) return an === bn ? a.i - b.i : an ? 1 : -1;
      const c =
        typeof a.v === "number" && typeof b.v === "number"
          ? a.v - b.v
          : String(a.v).localeCompare(String(b.v), "es", { numeric: true });
      return c === 0 ? a.i - b.i : c * sign;
    })
    .map((x) => x.row);
}

export const ariaSort = (sort: Sort | null, id: string) =>
  sort?.id === id ? (sort.dir === "asc" ? "ascending" : "descending") : "none";

export const pageCount = (total: number, size: number) => Math.max(1, Math.ceil(total / size));
export const clampPage = (page: number, pages: number) => Math.min(Math.max(1, page), pages);
export const pageSlice = <T>(rows: T[], page: number, size: number) => rows.slice((page - 1) * size, page * size);

export function rangeLabel(page: number, size: number, total: number) {
  if (total === 0) return "0 de 0";
  return `${(page - 1) * size + 1}–${Math.min(page * size, total)} de ${total}`;
}

export function pageItems(page: number, count: number): (number | "gap")[] {
  const wanted = new Set([1, count, page - 1, page, page + 1]);
  const nums = [...wanted].filter((n) => n >= 1 && n <= count).sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  nums.forEach((n, i) => {
    if (i > 0 && n - nums[i - 1] > 1) out.push("gap");
    out.push(n);
  });
  return out;
}

export function selectionState(ids: string[], selected: ReadonlySet<string>): "none" | "some" | "all" {
  const n = ids.filter((id) => selected.has(id)).length;
  return n === 0 ? "none" : n === ids.length ? "all" : "some";
}

export function togglePage(selected: ReadonlySet<string>, ids: string[]): Set<string> {
  const next = new Set(selected);
  const all = ids.length > 0 && ids.every((id) => next.has(id));
  ids.forEach((id) => (all ? next.delete(id) : next.add(id)));
  return next;
}

export function toggleRow(selected: ReadonlySet<string>, id: string): Set<string> {
  const next = new Set(selected);
  if (!next.delete(id)) next.add(id);
  return next;
}
