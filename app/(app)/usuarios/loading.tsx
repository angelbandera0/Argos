import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="stack" aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <div className="ui-user-stats">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="skeleton-row" />
        ))}
      </div>
      <Skeleton variant="pill" />
      <div className="list">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="skeleton-row" />
        ))}
      </div>
    </div>
  );
}
