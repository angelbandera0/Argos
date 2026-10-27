"use client";

import { Badge } from "@/components/ui/badge";
import { type Column, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";

export type AdminRow = { id: string; displayName: string; status: string; mustChangePassword: boolean };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

const columns: Column<AdminRow>[] = [
  {
    id: "name",
    header: "Administrador",
    sortValue: (a) => a.displayName.toLowerCase(),
    cell: (a) => (
      <span className="row">
        <span className="avatar" role="img" aria-label={a.displayName}>
          {initials(a.displayName)}
        </span>
        <strong>{a.displayName}</strong>
      </span>
    ),
  },
  {
    id: "status",
    header: "Estado",
    cell: (a) =>
      a.status !== "active" ? (
        <Badge variant="danger">Desactivado</Badge>
      ) : a.mustChangePassword ? (
        <Badge variant="warning">Pendiente de primer ingreso</Badge>
      ) : (
        <Badge variant="success">Activo</Badge>
      ),
  },
];

export function AdminTable({ rows }: { rows: AdminRow[] }) {
  return (
    <DataTable
      label="Administradores"
      columns={columns}
      rows={rows}
      getRowId={(a) => a.id}
      pageSize={25}
      empty={<EmptyState icon="ShieldCheck" title="Aún no hay administradores." />}
    />
  );
}
