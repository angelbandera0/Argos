"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Forbidden, NotFound, RuleViolation, SessionExpired } from "@/core/domain/errors";
import { requireCatalogUser, requireCategoryAdmin } from "./guard";

export interface CatalogActionState {
  error?: string;
  nameError?: string;
}

const text = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string) : "");

function fail(e: unknown, name: string): CatalogActionState {
  if (e instanceof RuleViolation) {
    if (e.code === "NAME_TAKEN") return { nameError: `Ya existe “${name.trim()}” en esta compañía. Elige otro nombre.` };
    if (e.code === "INVALID_NAME") return { nameError: "Escribe un nombre de hasta 80 caracteres." };
    if (e.code === "CATEGORY_HAS_PRODUCTS")
      return { error: "Esta categoría tiene productos. Cámbiales la categoría o elimínalos antes de borrarla." };
    if (e.code === "STORE_UNAVAILABLE") return { error: "Tu tienda activa no está disponible." };
  }
  if (e instanceof Forbidden || e instanceof SessionExpired) return { error: "No tienes permiso para hacer esto." };
  if (e instanceof NotFound) return { error: "No encontramos el elemento. Recarga la página." };
  return { error: "No se pudo completar la acción. Inténtalo de nuevo." };
}

export async function createCategoryAction(_: CatalogActionState, formData: FormData): Promise<CatalogActionState> {
  const { actor, catalog, companyId } = await requireCategoryAdmin();
  if (!companyId) return { error: "Elige una compañía arriba." };
  const name = text(formData, "name");
  try {
    await catalog.createCategory(actor, { companyId, name });
  } catch (e) {
    return fail(e, name);
  }
  revalidatePath("/catalogo", "layout");
  return {};
}

export async function renameCategoryAction(
  id: string,
  _: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const { actor, catalog } = await requireCategoryAdmin();
  const name = text(formData, "name");
  try {
    await catalog.renameCategory(actor, { id, name });
  } catch (e) {
    return fail(e, name);
  }
  revalidatePath("/catalogo", "layout");
  return {};
}

export async function deleteCategoryAction(id: string): Promise<CatalogActionState> {
  const { actor, catalog } = await requireCategoryAdmin();
  try {
    await catalog.deleteCategory(actor, { id });
  } catch (e) {
    return fail(e, "");
  }
  revalidatePath("/catalogo", "layout");
  return {};
}

export async function saveProductAction(
  productId: string | null,
  _: CatalogActionState,
  formData: FormData,
): Promise<CatalogActionState> {
  const { actor, catalog, companyId } = await requireCatalogUser();
  if (!companyId) return { error: "Elige una compañía arriba." };
  const name = text(formData, "name");
  const categoryId = text(formData, "categoryId");
  if (!categoryId) return { error: "Elige una categoría." };
  const description = text(formData, "description");
  const active = formData.has("active");
  try {
    if (productId) {
      await catalog.updateProduct(actor, { id: productId, name, categoryId, description });
      const current = (await catalog.listProducts(actor, { companyId })).find((p) => p.id === productId);
      if (current && current.active !== active) await catalog.setProductActive(actor, { id: productId, active });
    } else {
      await catalog.createProduct(actor, { companyId, name, categoryId, description, active });
    }
  } catch (e) {
    return fail(e, name);
  }
  revalidatePath("/catalogo", "layout");
  redirect("/catalogo/productos");
}

export async function deleteProductAction(id: string): Promise<CatalogActionState> {
  const { actor, catalog } = await requireCatalogUser();
  try {
    await catalog.deleteProduct(actor, { id });
  } catch (e) {
    return fail(e, "");
  }
  revalidatePath("/catalogo", "layout");
  redirect("/catalogo/productos");
}

export async function setProductActiveAction(id: string, active: boolean): Promise<CatalogActionState> {
  const { actor, catalog } = await requireCatalogUser();
  try {
    await catalog.setProductActive(actor, { id, active });
  } catch (e) {
    return fail(e, "");
  }
  revalidatePath("/catalogo", "layout");
  return {};
}

export async function bulkProductsAction(
  ids: string[],
  op: "activate" | "deactivate" | "category",
  categoryId?: string,
): Promise<CatalogActionState & { done: number; failed: number }> {
  const { actor, catalog } = await requireCatalogUser();
  if (op === "category" && !categoryId) return { error: "Elige una categoría.", done: 0, failed: ids.length };
  let done = 0;
  let error: string | undefined;
  for (const id of ids) {
    try {
      if (op === "category") await catalog.updateProduct(actor, { id, categoryId });
      else await catalog.setProductActive(actor, { id, active: op === "activate" });
      done++;
    } catch (e) {
      error ??= fail(e, "").error;
    }
  }
  revalidatePath("/catalogo", "layout");
  return { error, done, failed: ids.length - done };
}
