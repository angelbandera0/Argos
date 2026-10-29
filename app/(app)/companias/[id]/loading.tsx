import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="stack" aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <Skeleton variant="title" />
      <div className="ui-stat-grid">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} variant="pill" />
        ))}
      </div>
      <Card>
        <Skeleton onPanel variant="title" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} onPanel className="skeleton-row" />
        ))}
      </Card>
    </div>
  );
}
