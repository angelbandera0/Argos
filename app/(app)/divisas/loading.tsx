import { RouteProgress } from "@/components/ui/route-progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="stack" aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <RouteProgress />
      <Skeleton variant="pill" />
      <div className="ui-entity-card-grid">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="skeleton-row" />
        ))}
      </div>
    </div>
  );
}
