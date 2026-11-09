import { RouteProgress } from "@/components/ui/route-progress";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Card aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <RouteProgress />
      <Skeleton variant="title" onPanel />
      <Skeleton variant="pill" onPanel />
      <Skeleton variant="pill" onPanel />
    </Card>
  );
}
