"use client";

import { Chip } from "@/components/ui/chip";
import { type Column, DataTable } from "@/components/ui/data-table";
import { RevokeAccess } from "./admin-actions";

export type AdminRow = { id: string; name: string; founder: boolean };

export function AdminTable({ companyId, rows, canRevoke }: { companyId: string; rows: AdminRow[]; canRevoke: boolean }) {
  const columns: Column<AdminRow>[] = [
    {
      id: "name",
      header: "Administrador",
      cell: (p) => (
        <span className="row">
          <strong>{p.name}</strong>
          {p.founder && <Chip variant="open">Fundador</Chip>}
        </span>
      ),
    },
    {
      id: "action",
      header: "Acción",
      align: "end",
      cell: (p) =>
        p.founder ? (
          <span className="hint">El fundador no pierde el acceso</span>
        ) : canRevoke ? (
          <RevokeAccess companyId={companyId} adminId={p.id} name={p.name} />
        ) : null,
    },
  ];
  return <DataTable label="Administradores con acceso" columns={columns} rows={rows} getRowId={(p) => p.id} />;
}
