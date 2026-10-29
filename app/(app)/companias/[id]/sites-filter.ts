export type SiteFilterItem = { name: string; stores: { name: string }[] };

export function filterSites<T extends SiteFilterItem>(sites: T[], q: string): T[] {
  const n = q.trim().toLowerCase();
  if (!n) return sites;
  return sites.filter((s) => s.name.toLowerCase().includes(n) || s.stores.some((t) => t.name.toLowerCase().includes(n)));
}
