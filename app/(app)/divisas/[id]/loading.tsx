import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="form-shell form-shell-wide" aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <div className="form-shell-main">
        {[2, 1, 1].map((rows, i) => (
          <Card key={i}>
            <Skeleton onPanel variant="title" />
            {Array.from({ length: rows }, (_, j) => (
              <Skeleton key={j} onPanel className="skeleton-row" />
            ))}
          </Card>
        ))}
      </div>
      <Card>
        <Skeleton onPanel variant="title" />
        <Skeleton onPanel className="skeleton-row" />
        <Skeleton onPanel variant="pill" />
      </Card>
    </div>
  );
}
