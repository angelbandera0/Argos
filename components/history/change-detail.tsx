"use client";

import { type Column, DataTable } from "@/components/ui/data-table";
import { type FieldChange, diffFields, formatValue } from "./history-utils";

const columns: Column<FieldChange>[] = [
  { id: "field", header: "Campo", cell: (c) => <strong className="mono">{c.field}</strong> },
  { id: "before", header: "Anterior", cell: (c) => formatValue(c.before) },
  { id: "after", header: "Nuevo", cell: (c) => formatValue(c.after) },
];

export function ChangeDetail({ action, before, after }: { action: string; before: unknown; after: unknown }) {
  return (
    <DataTable
      label="Cambios por campo"
      density="compact"
      columns={columns}
      rows={diffFields(action, before, after)}
      getRowId={(c) => c.field}
      empty={<p className="muted">Sin cambios en campos visibles.</p>}
    />
  );
}
