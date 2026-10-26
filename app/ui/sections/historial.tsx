import { ChangeDetail } from "@/components/history/change-detail";
import { HistoryTable, type HistoryRow } from "@/components/history/history-table";
import { Specimen } from "../gallery";

const row = (i: number, action: string, before: unknown, after: unknown): HistoryRow => ({
  id: `h${i}`,
  createdAt: new Date(Date.UTC(2026, 9, 25, 15, 14 - i)).toISOString(),
  actor: i % 3 === 0 ? "Sistema" : "Ana Pérez",
  action,
  module: "Productos",
  entity: "Producto",
  entityId: `0000000${i}-aaaa`,
  channel: ["ui", "api", "app", "mcp", "system"][i % 5],
  before,
  after,
});

const ROWS = [
  row(0, "create", null, { name: "Café molido", price: 4.5, active: true }),
  row(1, "update", { name: "Café", price: 4.5, active: true, pin: "1234" }, { name: "Café molido", price: 5, active: true, pin: "9999" }),
  row(2, "deactivate", { active: true, updated_at: "2026-10-25T10:00:00Z" }, { active: false, updated_at: "2026-10-25T15:00:00Z" }),
  row(3, "reactivate", { active: false }, { active: true }),
  row(4, "delete", { name: "Té", price: 3, description: null }, null),
];

export function HistorialSection() {
  return (
    <>
      <Specimen title="Tabla de historial" note="Fecha en la zona del navegador; «Ver detalle» abre la comparación.">
        <HistoryTable rows={ROWS} />
      </Specimen>
      <Specimen title="Detalle de cambios" note="Solo campos que cambian; pin y password nunca se muestran.">
        <ChangeDetail action={ROWS[1].action} before={ROWS[1].before} after={ROWS[1].after} />
      </Specimen>
    </>
  );
}
