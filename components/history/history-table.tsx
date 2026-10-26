"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { type Column, DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ChangeDetail } from "./change-detail";
import { AUTH_EVENTS, actionInfo, channelLabel } from "./history-utils";
import { LocalDateTime } from "./local-date-time";

export type HistoryRow = {
  id: string;
  createdAt: string;
  actor: string;
  action: string;
  module: string;
  entity: string;
  entityId: string;
  channel: string;
  before: unknown;
  after: unknown;
};

const columns: Column<HistoryRow>[] = [
  { id: "date", header: "Fecha y hora", cell: (r) => <LocalDateTime value={r.createdAt} /> },
  { id: "actor", header: "Quién", cell: (r) => r.actor },
  {
    id: "action",
    header: "Acción",
    cell: (r) => <Badge variant={actionInfo(r.action).variant}>{actionInfo(r.action).label}</Badge>,
  },
  { id: "module", header: "Módulo", cell: (r) => r.module },
  {
    id: "entity",
    header: "Entidad",
    cell: (r) => (
      <>
        {r.entity} <span className="muted mono">{r.entityId.slice(0, 8)}</span>
      </>
    ),
  },
  { id: "channel", header: "Canal", cell: (r) => <Badge>{channelLabel(r.channel)}</Badge> },
];

export function HistoryTable({ rows }: { rows: HistoryRow[] }) {
  const [selected, setSelected] = useState<HistoryRow | null>(null);
  return (
    <>
      <DataTable
        label="Historial de operaciones"
        columns={columns}
        rows={rows}
        getRowId={(r) => r.id}
        rowActions={(r) => [{ label: "Ver detalle", onSelect: () => setSelected(r) }]}
        rowActionsLabel={(id) => `Acciones de la operación ${id.slice(0, 8)}`}
        empty={<EmptyState icon="Search" title="Ninguna operación coincide con los filtros." />}
      />
      <Dialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        size="lg"
        showClose
        title="Detalle del cambio"
        description={selected ? `${actionInfo(selected.action).label} · ${selected.entity} · ${selected.actor}` : undefined}
      >
        {selected && <ChangeDetail action={selected.action} before={selected.before} after={selected.after} />}
      </Dialog>
    </>
  );
}

export type AuthEventRow = { id: string; createdAt: string; user: string; event: string; channel: string };

const authColumns: Column<AuthEventRow>[] = [
  { id: "date", header: "Fecha y hora", cell: (r) => <LocalDateTime value={r.createdAt} /> },
  { id: "user", header: "Usuario", cell: (r) => r.user },
  {
    id: "event",
    header: "Evento",
    cell: (r) => {
      const e = AUTH_EVENTS[r.event] ?? { label: r.event, variant: "neutral" as const };
      return <Badge variant={e.variant}>{e.label}</Badge>;
    },
  },
  { id: "channel", header: "Canal", cell: (r) => <Badge>{channelLabel(r.channel)}</Badge> },
];

export function AuthEventTable({ rows }: { rows: AuthEventRow[] }) {
  return (
    <DataTable
      label="Eventos de acceso"
      columns={authColumns}
      rows={rows}
      getRowId={(r) => r.id}
      empty={<EmptyState icon="ShieldCheck" title="Aún no hay eventos de acceso." />}
    />
  );
}
