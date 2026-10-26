import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <Skeleton variant="title" />
      <Skeleton variant="text" />
    </div>
  );
}
