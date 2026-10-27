"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { type Column, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";

export type ProductRow = { id: string; name: string; category: string; active: boolean };

const columns: Column<ProductRow>[] = [
  {
    id: "name",
    header: "Producto",
    sortValue: (p) => p.name.toLowerCase(),
    cell: (p) => (
      <Link href={`/catalogo/productos/${p.id}`}>
        <strong>{p.name}</strong>
      </Link>
    ),
  },
  { id: "category", header: "Categoría", sortValue: (p) => p.category.toLowerCase(), cell: (p) => p.category },
  {
    id: "status",
    header: "Estado",
    cell: (p) => <Badge variant={p.active ? "success" : "neutral"}>{p.active ? "Activo" : "Inactivo"}</Badge>,
  },
];

export function ProductTable({ rows }: { rows: ProductRow[] }) {
  return (
    <DataTable
      label="Productos"
      columns={columns}
      rows={rows}
      getRowId={(p) => p.id}
      pageSize={25}
      empty={<EmptyState icon="Search" title="Ningún producto coincide con la búsqueda." />}
    />
  );
}
