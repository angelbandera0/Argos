import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="stack" aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <Card>
        <div className="row">
          <Skeleton onPanel variant="circle" />
          <Skeleton onPanel variant="title" />
        </div>
      </Card>
      <Skeleton variant="pill" />
      <Card>
        <div className="list">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} onPanel className="skeleton-row" />
          ))}
        </div>
      </Card>
    </div>
  );
}
