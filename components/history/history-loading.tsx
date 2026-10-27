import { AuditTable } from "@/components/ui/audit-table";
import { Skeleton } from "@/components/ui/skeleton";

export function HistoryLoading() {
  return (
    <div className="stack" aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <Skeleton variant="pill" />
      <Skeleton variant="pill" />
      <AuditTable label="Cargando historial" groups={[]} loading />
    </div>
  );
}
