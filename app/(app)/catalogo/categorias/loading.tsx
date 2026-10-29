import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="ui-cat-layout" aria-busy="true">
      <span className="sr-only">Cargando…</span>
      <div className="ui-cat-main">
        <Skeleton className="ui-cat-skel" />
        <div className="ui-cat-card">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="ui-cat-skel" />
          ))}
        </div>
      </div>
      <Skeleton className="ui-cat-skel" />
    </div>
  );
}
