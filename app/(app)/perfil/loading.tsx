import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Card aria-busy="true">
      <span className="sr-only">Cargando…</span>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} onPanel className="skeleton-row" />
      ))}
    </Card>
  );
}
