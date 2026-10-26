import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Card aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <Skeleton variant="text" onPanel style={{ width: "20%" }} />
      <Skeleton variant="title" onPanel />
      <Skeleton variant="pill" onPanel />
      <Skeleton variant="pill" onPanel />
      <Skeleton variant="pill" onPanel />
    </Card>
  );
}
