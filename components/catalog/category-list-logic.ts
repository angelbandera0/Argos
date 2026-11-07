import { nameKey } from "@/core/domain/name";

export interface CategoryItem {
  id: string;
  name: string;
  count: number;
}

export const LOCKED_TITLE = "Tiene productos: muévelos a otra categoría primero";
export const DUPLICATE_MESSAGE = "Ya existe una categoría con ese nombre.";

export const productsLabel = (n: number) => (n === 0 ? "Sin productos" : n === 1 ? "1 producto" : `${n} productos`);
export const categoriesLabel = (n: number) => (n === 1 ? "1 categoría" : `${n} categorías`);
export const updateNote = (n: number) => `Se actualizará en ${n === 1 ? "1 producto" : `${n} productos`}.`;

export const canDelete = (c: Pick<CategoryItem, "count">) => c.count === 0;

export function isDuplicate(name: string, items: CategoryItem[], excludeId?: string) {
  const key = nameKey(name);
  return items.some((c) => c.id !== excludeId && nameKey(c.name) === key);
}

export function filterCategories(items: CategoryItem[], query: string) {
  const key = nameKey(query);
  return key ? items.filter((c) => nameKey(c.name).includes(key)) : items;
}
