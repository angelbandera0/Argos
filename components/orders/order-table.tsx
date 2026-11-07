"use client";

import { LocalDateTime } from "@/components/ui/local-date-time";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import type { OrderStatus } from "@/core/domain/orders";
import { orderBadge } from "./order-logic";
import Link from "next/link";

export type OrderRow = { id: string; number: string; status: OrderStatus; buyer: string; lineCount: number; createdAt: string };

export function OrderTable({ rows }: { rows: OrderRow[] }) {
  return (
    <DataTable
      label="Pedidos"
      rows={rows}
      getRowId={(r) => r.id}
      columns={[
        { id: "number", header: "Nº", cell: (r) => <Link href={`/pedidos/${r.id}`}>{r.number}</Link> },
        { id: "status", header: "Estado", cell: (r) => <StatusBadge {...orderBadge(r.status)} /> },
        { id: "buyer", header: "Comprador", cell: (r) => r.buyer },
        { id: "lines", header: "Líneas", align: "end", cell: (r) => r.lineCount },
        { id: "date", header: "Creado", cell: (r) => <LocalDateTime value={r.createdAt} /> },
      ]}
    />
  );
}
