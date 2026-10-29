import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="stack" aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <Skeleton variant="pill" />
      <div className="ui-entity-card-grid">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="skeleton-row" />
        ))}
      </div>
    </div>
  );
}
