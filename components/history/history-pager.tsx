import Link from "next/link";
import { NAV_ICONS } from "@/components/icons";
import { buttonClass } from "@/components/ui/button-class";
import { type HistoryFilters, filtersQuery, pageLinks } from "./history-utils";

const { ChevronLeft, ChevronRight } = NAV_ICONS;

/** «Anterior» / «Siguiente» over a cursor stack kept in the URL (`cursor`, `prev`). */
export function HistoryPager({ path, filters, nextCursor }: { path: string; filters: HistoryFilters; nextCursor: string | null }) {
  const { page, prev, next } = pageLinks(filters, nextCursor);
  if (!prev && !next) return null;
  return (
    <nav aria-label="Paginación" className="audit-foot-pager">
      {prev && (
        <Link className={buttonClass("secondary", "sm")} href={`${path}${filtersQuery(filters, prev)}`} rel="prev">
          <ChevronLeft aria-hidden="true" />
          Anterior
        </Link>
      )}
      <span aria-current="page">Página {page}</span>
      {next && (
        <Link className={buttonClass("secondary", "sm")} href={`${path}${filtersQuery(filters, next)}`} rel="next">
          Siguiente
          <ChevronRight aria-hidden="true" />
        </Link>
      )}
    </nav>
  );
}
