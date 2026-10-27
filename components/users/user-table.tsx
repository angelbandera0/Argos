"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { type Column, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";

export type UserRow = { id: string; displayName: string; username: string | null; status: "active" | "locked" | "deactivated" };

const STATUS = {
  active: { label: "Activo", variant: "success" },
  locked: { label: "Bloqueado", variant: "danger" },
  deactivated: { label: "Desactivado", variant: "neutral" },
} as const;

const columns: Column<UserRow>[] = [
  {
    id: "name",
    header: "Usuario",
    sortValue: (u) => u.displayName.toLowerCase(),
    cell: (u) => (
      <Link href={`/usuarios/${u.id}`}>
        <strong>{u.displayName}</strong>
      </Link>
    ),
  },
  { id: "username", header: "Nombre de usuario", cell: (u) => <span className="mono">{u.username}</span> },
  {
    id: "status",
    header: "Estado",
    cell: (u) => <Badge variant={STATUS[u.status].variant}>{STATUS[u.status].label}</Badge>,
  },
];

export function UserTable({ rows }: { rows: UserRow[] }) {
  return (
    <DataTable
      label="Usuarios"
      columns={columns}
      rows={rows}
      getRowId={(u) => u.id}
      pageSize={25}
      empty={<EmptyState icon="Search" title="Ningún usuario coincide con la búsqueda." />}
    />
  );
}
