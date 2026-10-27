"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { normalizeName, validateName } from "@/core/domain/name";
import { requireUserAdmin } from "./guard";

export interface NewUserState {
  error?: string;
  name?: string;
  displayName?: string;
  userId?: string;
  pin?: string;
}

export interface ActionResult {
  error?: string;
  pin?: string;
}

const text = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string) : "");

function fail(e: unknown): string {
  if (e instanceof Forbidden) return "No tienes permiso para hacer esto.";
  if (e instanceof NotFound) return "No encontramos lo que buscas. Recarga la página.";
  if (e instanceof RuleViolation) {
    if (e.code === "NAME_TAKEN") return "Ya existe un usuario con ese nombre de usuario.";
    if (e.code === "INVALID_USERNAME") return "El nombre de usuario lleva de 2 a 24 letras minúsculas, números, guion o guion bajo.";
    if (e.code === "INVALID_NAME") return "Escribe un nombre de hasta 80 caracteres.";
    if (e.code === "ROLE_EXCLUDED") return "Ese rol no está disponible para esta compañía.";
  }
  return "No se pudo completar la acción. Inténtalo de nuevo.";
}

export async function createUserAction(_: NewUserState, formData: FormData): Promise<NewUserState> {
  const { actor, users, company } = await requireUserAdmin();
  const name = text(formData, "name").trim().toLowerCase();
  const displayName = normalizeName(text(formData, "displayName"));
  const roleId = text(formData, "roleId");
  const storeIds = formData.getAll("storeId").filter((v): v is string => typeof v === "string");
  const echo = { name, displayName };
  if (!company) return { ...echo, error: "Elige una compañía activa." };
  try {
    validateName(displayName);
  } catch {
    return { ...echo, error: fail(new RuleViolation("INVALID_NAME")) };
  }
  if (!roleId) return { ...echo, error: "Elige un rol." };
  if (storeIds.length === 0) return { ...echo, error: "Elige al menos una tienda." };
  try {
    const r = await users.createOperator(actor, { companyId: company.id, name, displayName, roleId, storeIds });
    revalidatePath("/usuarios", "layout");
    return { ...echo, userId: r.userId, pin: r.pin };
  } catch (e) {
    return { ...echo, error: fail(e) };
  }
}

export async function resetPinAction(userId: string): Promise<ActionResult> {
  const { actor, users } = await requireUserAdmin();
  try {
    const { pin } = await users.resetPin(actor, { userId });
    revalidatePath("/usuarios", "layout");
    return { pin };
  } catch (e) {
    return { error: fail(e) };
  }
}

export async function unlockUserAction(userId: string): Promise<ActionResult> {
  const { actor, users } = await requireUserAdmin();
  try {
    const { pin } = await users.unlockUser(actor, { userId });
    revalidatePath("/usuarios", "layout");
    return { pin };
  } catch (e) {
    return { error: fail(e) };
  }
}

export async function deactivateUserAction(userId: string): Promise<ActionResult> {
  const { actor, users } = await requireUserAdmin();
  try {
    await users.deactivateUser(actor, { userId });
  } catch (e) {
    return { error: fail(e) };
  }
  revalidatePath("/usuarios", "layout");
  redirect("/usuarios");
}

export async function saveAssignmentsAction(
  userId: string,
  assignments: { storeId: string; roleId: string }[],
): Promise<ActionResult> {
  const { actor, users } = await requireUserAdmin();
  const clean = assignments.filter((a) => typeof a.storeId === "string" && typeof a.roleId === "string");
  if (clean.length === 0) return { error: "Elige al menos una tienda." };
  try {
    await users.assignStores(actor, { userId, assignments: clean });
  } catch (e) {
    return { error: fail(e) };
  }
  revalidatePath("/usuarios", "layout");
  return {};
}
