import type { Module, Op, PermissionSet, SpecialGrant } from "@/core/domain/permissions";
import { MODULE_GROUPS, specialLabels } from "./role-form-logic";

export const OPS: { op: Op; label: string }[] = [
  { op: "view", label: "Ver" },
  { op: "create", label: "Crear" },
  { op: "edit", label: "Editar" },
  { op: "delete", label: "Eliminar" },
];

export function extraPermissionLabels(permissions: Record<Module, PermissionSet>, grants: SpecialGrant[]): string[] {
  const modules = MODULE_GROUPS.filter((m) => permissions[m.key].view).map((m) => m.label);
  return [...modules, ...specialLabels(grants)];
}

export function allowedCompanies<C extends { id: string }>(companies: C[], excludedIds: string[]): C[] {
  return companies.filter((c) => !excludedIds.includes(c.id));
}

export const sessionLabel = (seconds: number | null) => {
  if (seconds === null) return "Tope de la compañía";
  const h = Math.round((seconds / 3600) * 10) / 10;
  return `${h} ${h === 1 ? "hora" : "horas"}`.replace(".", ",");
};

export const usersLabel = (n: number) => (n === 0 ? "Ninguno" : `${n} ${n === 1 ? "usuario" : "usuarios"}`);

export function parseCompanyFilter(value: unknown, companyIds: string[]): string {
  return typeof value === "string" && companyIds.includes(value) ? value : "";
}

export const companiesLabel = (companies: string[] | "all") =>
  companies === "all" ? "Todas" : companies.length === 0 ? "Ninguna" : `${companies.length} ${companies.length === 1 ? "compañía" : "compañías"}`;

export function roleCardData(r: { companies: string[] | "all"; sessionSeconds: number | null; usersCount: number }) {
  return [
    { label: "Compañías", value: companiesLabel(r.companies) },
    { label: "Sesión", value: sessionLabel(r.sessionSeconds) },
    { label: "Usuarios", value: usersLabel(r.usersCount) },
  ];
}

export const ROLE_ACTIONS = ["edit", "delete"] as const;
