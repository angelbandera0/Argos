import { companiesLabel, sessionLabel, usersLabel } from "@/components/roles/role-card-data";
import { ALL_MODULES } from "@/components/roles/role-form-logic";
import type { Module, PermissionSet, SpecialGrant } from "@/core/domain/permissions";
import { isValidUsernameName } from "@/core/domain/username";

export const cleanUsername = (raw: string) => raw.toLowerCase().replace(/\s/g, "");

export type UsernameFormat = "empty" | "invalid" | "ok";

export function usernameFormat(name: string): UsernameFormat {
  if (!name) return "empty";
  return isValidUsernameName(name) ? "ok" : "invalid";
}

/** «Marta López» -> «marta-l»; empty when nothing valid can be derived. */
export function suggestUsername(displayName: string): string {
  const words = displayName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);
  if (words.length === 0) return "";
  const s = words.length > 1 ? `${words[0]}-${words[1][0]}` : words[0];
  return isValidUsernameName(s) ? s : "";
}

export type SiteGroup<T> = { site: string; stores: T[] };

export function groupBySite<T extends { site: string }>(stores: T[]): SiteGroup<T>[] {
  const groups = new Map<string, T[]>();
  for (const s of stores) groups.set(s.site, [...(groups.get(s.site) ?? []), s]);
  return [...groups].map(([site, list]) => ({ site, stores: list }));
}

export function groupState(selected: number, total: number): "all" | "some" | "none" {
  return selected === 0 ? "none" : selected === total ? "all" : "some";
}

export function checklist(input: { name: string; username: "ok" | "other"; hasRole: boolean; stores: number }) {
  const items = [
    { state: input.name.trim() ? "ok" : "todo", label: "Nombre de la persona" },
    { state: input.username === "ok" ? "ok" : "todo", label: "Nombre de usuario disponible" },
    { state: input.hasRole ? "ok" : "todo", label: "Rol elegido" },
    { state: input.stores > 0 ? "ok" : "todo", label: "Al menos una tienda" },
  ] as const;
  return { items: [...items], complete: items.every((i) => i.state === "ok") };
}

export type UserStepKey = "data" | "role" | "stores" | "summary";
export type UserField = "displayName" | "name" | "roleId" | "storeIds";

const STEP_DEFS: Record<UserStepKey, { title: string; description: string }> = {
  data: { title: "Datos", description: "Nombre y usuario" },
  role: { title: "Rol", description: "Qué podrá hacer" },
  stores: { title: "Tiendas", description: "Dónde entra" },
  summary: { title: "Resumen", description: "Revisar y guardar" },
};

export const userStepKeys = (mode: "create" | "edit"): UserStepKey[] =>
  mode === "create" ? ["data", "role", "stores", "summary"] : ["role", "stores", "summary"];

export const userSteps = (keys: UserStepKey[]) => keys.map((k) => STEP_DEFS[k]);

export interface UserDraft {
  displayName: string;
  username: string;
  usernameAvailable: boolean | undefined;
  roleId: string;
  roleValid: boolean;
  storeIds: string[];
}

export function userStepError(key: UserStepKey, d: UserDraft): string | undefined {
  if (key === "data") {
    if (!d.displayName.trim()) return "Escribe el nombre de la persona.";
    if (usernameFormat(d.username) !== "ok") return "Escribe un nombre de usuario válido (2 a 24 letras minúsculas, números, guion o guion bajo).";
    if (d.usernameAvailable === false) return "Ese nombre de usuario ya existe.";
    if (d.usernameAvailable === undefined) return "Espera a que se compruebe el nombre de usuario.";
  }
  if (key === "role") {
    if (!d.roleId) return "Elige un rol.";
    if (!d.roleValid) return "Ese rol no vale en esta compañía. Elige otro.";
  }
  if (key === "stores" && d.storeIds.length === 0) return "Marca al menos una tienda.";
  return undefined;
}

export function userNextStep(keys: UserStepKey[], step: number, d: UserDraft): { step: number; error?: string } {
  const error = userStepError(keys[step], d);
  return error ? { step, error } : { step: Math.min(step + 1, keys.length - 1) };
}

export const userComplete = (keys: UserStepKey[], d: UserDraft) => keys.every((k) => !userStepError(k, d));

/** Every field of every step, built from state so it never depends on the mounted step. */
export function userFields(d: Pick<UserDraft, "displayName" | "username" | "roleId" | "storeIds">, mode: "create" | "edit"): [string, string][] {
  return [
    ...(mode === "create" ? ([["displayName", d.displayName], ["name", d.username]] as [string, string][]) : []),
    ["roleId", d.roleId],
    ...d.storeIds.map((id): [string, string] => ["storeId", id]),
  ];
}

const FIELD_KEY: Record<UserField, UserStepKey> = { displayName: "data", name: "data", roleId: "role", storeIds: "stores" };

export function stepForField(keys: UserStepKey[], field: string | undefined): number {
  const i = field ? keys.indexOf(FIELD_KEY[field as UserField]) : -1;
  return i;
}

export interface RolePreviewSource {
  id: string;
  name: string;
  sessionSeconds: number | null;
  permissions: Record<Module, PermissionSet>;
  grants: SpecialGrant[];
  companies: { id: string; name: string; allowed: boolean }[];
  users: string[];
}

export function rolePreview(role: RolePreviewSource | undefined, companyId: string) {
  if (!role) return null;
  const allowed = role.companies.filter((c) => c.allowed).map((c) => c.name);
  return {
    stats: [
      { icon: "Building2", label: "Compañías", value: companiesLabel(allowed.length === role.companies.length ? "all" : allowed) },
      { icon: "History", label: "Sesión", value: sessionLabel(role.sessionSeconds) },
      { icon: "Users", label: "Usuarios con este rol", value: usersLabel(role.users.length) },
    ] as const,
    allowed,
    validForCompany: role.companies.find((c) => c.id === companyId)?.allowed ?? false,
    moduleKeys: ALL_MODULES.map((m) => m.key),
  };
}

export function rolePreviewSource(
  r: { id: string; name: string; sessionSeconds: number | null; excludedCompanyIds: string[]; permissions: Record<Module, PermissionSet>; specialPermissions: SpecialGrant[] },
  companies: { id: string; name: string }[],
  assigned: { roleId: string; displayName: string }[],
): RolePreviewSource {
  return {
    id: r.id,
    name: r.name,
    sessionSeconds: r.sessionSeconds,
    permissions: r.permissions,
    grants: r.specialPermissions,
    companies: companies.map((c) => ({ id: c.id, name: c.name, allowed: !r.excludedCompanyIds.includes(c.id) })),
    users: assigned.filter((u) => u.roleId === r.id).map((u) => u.displayName),
  };
}
