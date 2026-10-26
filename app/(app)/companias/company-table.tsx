"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { type Column, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";

export type CompanyRow = { id: string; name: string; code: string; status: "active" | "inactive" };

const columns: Column<CompanyRow>[] = [
  {
    id: "name",
    header: "Compañía",
    sortValue: (c) => c.name.toLowerCase(),
    cell: (c) => (
      <Link href={`/companias/${c.id}`}>
        <strong>{c.name}</strong>
      </Link>
    ),
  },
  {
    id: "code",
    header: "Código",
    cell: (c) => (
      <Chip variant="ring" className="mono">
        {c.code}
      </Chip>
    ),
  },
  {
    id: "status",
    header: "Estado",
    cell: (c) =>
      c.status === "active" ? <Badge variant="success">Activa</Badge> : <Badge variant="danger">Desactivada</Badge>,
  },
];

export function CompanyTable({ rows }: { rows: CompanyRow[] }) {
  return (
    <DataTable
      label="Compañías"
      columns={columns}
      rows={rows}
      getRowId={(c) => c.id}
      pageSize={25}
      empty={<EmptyState icon="Search" title="Ninguna compañía coincide con la búsqueda." />}
    />
  );
}
