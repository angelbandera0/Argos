import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Card aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <Skeleton variant="title" onPanel />
      <Skeleton variant="text" onPanel />
    </Card>
  );
}
