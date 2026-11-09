import { RouteProgress } from "@/components/ui/route-progress";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="form-shell form-shell-wide" aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <RouteProgress />
      <div className="form-shell-main">
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
      <Card>
        <Skeleton onPanel variant="title" />
        <Skeleton onPanel className="skeleton-row" />
        <Skeleton onPanel variant="pill" />
      </Card>
    </div>
  );
}
