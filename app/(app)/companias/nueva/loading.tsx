import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <Card aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <Skeleton onPanel variant="text" />
      <Skeleton onPanel variant="pill" />
      <Skeleton onPanel variant="pill" />
    </Card>
  );
}
