import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="stack" aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <Card>
        <Skeleton onPanel variant="title" />
        <Skeleton onPanel variant="pill" />
        <Skeleton onPanel variant="pill" />
      </Card>
      <Card>
        <Skeleton onPanel variant="title" />
        <Skeleton onPanel className="skeleton-row" />
        <Skeleton onPanel className="skeleton-row" />
      </Card>
      <Card>
        <Skeleton onPanel variant="title" />
        <Skeleton onPanel className="skeleton-row" />
      </Card>
    </div>
  );
}
