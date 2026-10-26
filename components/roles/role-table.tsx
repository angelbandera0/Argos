"use client";

import Link from "next/link";
import { Chip } from "@/components/ui/chip";
import { type Column, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";

export type RoleRow = { id: string; name: string; excluded: number };

const columns: Column<RoleRow>[] = [
  {
    id: "name",
    header: "Rol",
    sortValue: (r) => r.name.toLowerCase(),
    cell: (r) => (
      <Link href={`/roles/${r.id}`}>
        <strong>{r.name}</strong>
      </Link>
    ),
  },
  {
    id: "companies",
    header: "Compañías",
    cell: (r) => (
      <Chip variant="ring">
        {r.excluded === 0 ? "Todas las compañías" : `${r.excluded} excluida${r.excluded === 1 ? "" : "s"}`}
      </Chip>
    ),
  },
];

export function RoleTable({ rows }: { rows: RoleRow[] }) {
  return (
    <DataTable
      label="Roles"
      columns={columns}
      rows={rows}
      getRowId={(r) => r.id}
      pageSize={25}
      empty={<EmptyState icon="Search" title="Ningún rol coincide con la búsqueda." />}
    />
  );
}
