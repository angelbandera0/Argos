import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="stack" aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <Skeleton variant="title" />
      <div className="meters">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="pill" className="meter-skeleton" />
        ))}
      </div>
      <div className="dash-grid">
        {[0, 1, 2, 3, 4].map((i) => (
          <Card key={i} className={i === 1 ? "dash-analytics" : undefined}>
            <Skeleton onPanel variant="pill" />
            {[0, 1, 2].map((j) => (
              <Skeleton key={j} onPanel className="skeleton-row" />
            ))}
          </Card>
        ))}
      </div>
    </div>
  );
}
