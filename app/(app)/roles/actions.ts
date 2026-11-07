"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { RoleInput } from "@/core/application/ports/role-repository";
import { Forbidden, NotFound, RuleViolation } from "@/core/domain/errors";
import { MODULES, SPECIAL_PERMISSIONS, type SpecialGrant } from "@/core/domain/permissions";
import { requireRoleUser } from "./guard";

export interface RoleActionState {
  error?: string;
  nameError?: string;
}

const text = (f: FormData, k: string) => (typeof f.get(k) === "string" ? (f.get(k) as string) : "");
const OPS = ["view", "create", "edit", "delete"] as const;

function parse(
  f: FormData,
): { name: string; sessionSeconds: number | null; checked: string[]; permissions: RoleInput["permissions"]; specialPermissions: SpecialGrant[] } | string {
  const hours = text(f, "hours");
  const sessionSeconds = hours === "" ? null : Math.round(Number(hours) * 3600);
  if (sessionSeconds !== null && (!Number.isFinite(sessionSeconds) || sessionSeconds <= 0 || sessionSeconds > 86400)) {
    return "Escribe un tiempo de sesión entre media hora y 24 horas.";
  }
  const permissions = Object.fromEntries(MODULES.map((m) => [m, Object.fromEntries(OPS.map((o) => [o, f.has(`${m}.${o}`)]))])) as RoleInput["permissions"];
  const specialPermissions = SPECIAL_PERMISSIONS.filter((s) => f.has(`special.${s}`)).map((s) => ({ permission: s, warehouse: text(f, `special.${s}`) === "warehouse" }));
  return { name: text(f, "name"), sessionSeconds, checked: f.getAll("company").map(String), permissions, specialPermissions };
}

function fail(e: unknown, name: string): RoleActionState {
  if (e instanceof RuleViolation) {
    if (e.code === "NAME_TAKEN") return { nameError: `Ya tienes un rol llamado “${name.trim()}”. Elige otro nombre.` };
    if (e.code === "INVALID_NAME") return { nameError: "Escribe un nombre de hasta 80 caracteres." };
    if (e.code === "NOTIFICATIONS_VIEW_ONLY") return { error: "Notificaciones solo permite “Ver”." };
    if (e.code === "PERMISSION_REQUIRES_VIEW") return { error: "Crear, editar y eliminar exigen también “Ver”." };
    if (e.code === "SESSION_TOO_LONG" || e.code === "INVALID_SESSION_SECONDS")
      return { error: "Escribe un tiempo de sesión entre media hora y 24 horas." };
    if (e.code === "HAS_DATA") return { error: "Este rol está asignado a usuarios. Cámbiales el rol antes de eliminarlo." };
  }
  if (e instanceof Forbidden) return { error: "No tienes permiso para hacer esto." };
  if (e instanceof NotFound) return { error: "No encontramos el rol. Recarga la página." };
  return { error: "No se pudo completar la acción. Inténtalo de nuevo." };
}

export async function saveRoleAction(
  roleId: string | null,
  _: RoleActionState,
  formData: FormData,
): Promise<RoleActionState> {
  const { actor, org, roles } = await requireRoleUser();
  const p = parse(formData);
  if (typeof p === "string") return { error: p };
  try {
    const checked = new Set(p.checked);
    const excludedCompanyIds = (await org.listCompanies(actor)).map((c) => c.id).filter((id) => !checked.has(id));
    const data = { name: p.name, sessionSeconds: p.sessionSeconds, excludedCompanyIds, permissions: p.permissions, specialPermissions: p.specialPermissions };
    if (roleId) await roles.updateRole(actor, roleId, data);
    else await roles.createRole(actor, data);
  } catch (e) {
    return fail(e, p.name);
  }
  revalidatePath("/roles", "layout");
  redirect("/roles");
}

export async function deleteRoleAction(roleId: string): Promise<RoleActionState> {
  const { actor, roles } = await requireRoleUser();
  try {
    await roles.deleteRole(actor, roleId);
  } catch (e) {
    return fail(e, "");
  }
  revalidatePath("/roles", "layout");
  redirect("/roles");
}
