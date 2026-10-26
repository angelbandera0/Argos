import Link from "next/link";
import { buttonClass } from "@/components/ui/button-class";
import { type HistoryFilters, filtersQuery } from "./history-utils";

export function HistoryPager({ path, filters, nextCursor }: { path: string; filters: HistoryFilters; nextCursor: string | null }) {
  if (!filters.cursor && !nextCursor) return null;
  return (
    <nav aria-label="Paginación" className="row">
      {filters.cursor && (
        <Link className={buttonClass("secondary", "md")} href={`${path}${filtersQuery(filters)}`}>
          Primera página
        </Link>
      )}
      {nextCursor && (
        <Link className={buttonClass("secondary", "md")} href={`${path}${filtersQuery(filters, nextCursor)}`}>
          Siguiente
        </Link>
      )}
    </nav>
  );
}
