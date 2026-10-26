import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="stack" aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <Card>
        <Skeleton onPanel variant="title" />
        <Skeleton onPanel variant="pill" />
      </Card>
      <Card>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} onPanel className="skeleton-row" />
        ))}
      </Card>
    </div>
  );
}
