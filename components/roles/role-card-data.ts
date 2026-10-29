import type { Op } from "@/core/domain/permissions";

export const OPS: { op: Op; label: string }[] = [
  { op: "view", label: "Ver" },
  { op: "create", label: "Crear" },
  { op: "edit", label: "Editar" },
  { op: "delete", label: "Eliminar" },
];

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
