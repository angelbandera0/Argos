import type { Op, PermissionSet } from "@/core/domain/permissions";

export const OPS: { op: Op; label: string }[] = [
  { op: "view", label: "Ver" },
  { op: "create", label: "Crear" },
  { op: "edit", label: "Editar" },
  { op: "delete", label: "Eliminar" },
];

export const SESSION_HOURS = [4, 8, 12, 24];

export const ADMIN_ONLY_MODULES = ["Compañías", "Sedes", "Tiendas", "Usuarios", "Roles", "Categorías"];

const set = (view: boolean, create: boolean, edit: boolean, del: boolean): PermissionSet => ({ view, create, edit, delete: del });

export const TEMPLATES: { key: string; label: string; set: PermissionSet }[] = [
  { key: "read", label: "Solo consulta", set: set(true, false, false, false) },
  { key: "ops", label: "Operativo", set: set(true, true, true, false) },
  { key: "full", label: "Completo", set: set(true, true, true, true) },
  { key: "none", label: "Ninguno", set: set(false, false, false, false) },
];

export function matchTemplate(p: PermissionSet): string | null {
  return TEMPLATES.find((t) => OPS.every(({ op }) => t.set[op] === p[op]))?.key ?? null;
}

export function toggle(p: PermissionSet, op: Op, on: boolean): PermissionSet {
  if (op === "view") return on ? { ...p, view: true } : set(false, false, false, false);
  return { ...p, [op]: on, view: on ? true : p.view };
}

export const isViewLocked = (p: PermissionSet) => p.create || p.edit || p.delete;

export function allState(p: PermissionSet): "all" | "some" | "none" {
  const n = OPS.filter(({ op }) => p[op]).length;
  return n === OPS.length ? "all" : n === 0 ? "none" : "some";
}

export const toggleAll = (p: PermissionSet): PermissionSet => (allState(p) === "all" ? set(false, false, false, false) : set(true, true, true, true));

export const permissionSummary = (p: PermissionSet) =>
  OPS.filter(({ op }) => p[op])
    .map(({ label }) => label)
    .join(" · ") || "Sin permisos";

export const sessionSummary = (hours: string) => (hours ? `Sesión: ${hours} h` : "Sesión: tope de la compañía");

export function nameError(name: string): string | undefined {
  const n = name.trim().length;
  if (n === 0) return "Escribe un nombre para el rol.";
  if (n < 3) return "Escribe al menos 3 letras.";
  return undefined;
}

export type CheckItem = { state: "ok" | "warn" | "todo"; label: string };

export function checklist(name: string, companies: number, permissions: PermissionSet): { items: CheckItem[]; complete: boolean } {
  const nameOk = !nameError(name);
  const hasPerms = OPS.some(({ op }) => permissions[op]);
  return {
    complete: nameOk && companies > 0,
    items: [
      { state: nameOk ? "ok" : "todo", label: "Nombre de al menos 3 letras" },
      { state: companies > 0 ? "ok" : "todo", label: "Al menos una compañía" },
      { state: hasPerms ? "ok" : "warn", label: hasPerms ? "Tiene permisos en Productos" : "Sin permisos: solo podrá iniciar sesión" },
    ],
  };
}
