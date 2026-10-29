"use client";

import { NAV_ICONS } from "@/components/icons";
import { pageItems } from "./data-table-utils";

const { ChevronLeft, ChevronRight } = NAV_ICONS;

export function Pager({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(Math.max(1, page), pages);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(current * pageSize, total);
  return (
    <div className="ui-pager">
      <nav className="ui-pager-nav" aria-label="Paginación">
        <button type="button" className="ui-pager-step" disabled={current <= 1} onClick={() => onPageChange(current - 1)}>
          <ChevronLeft aria-hidden="true" />
          Anterior
        </button>
        {pageItems(current, pages).map((n, i) =>
          n === "gap" ? (
            <span key={`g${i}`} aria-hidden="true">…</span>
          ) : (
            <button
              key={n}
              type="button"
              className="ui-pager-page"
              aria-label={`Página ${n}`}
              aria-current={n === current ? "page" : undefined}
              onClick={() => onPageChange(n)}
            >
              {n}
            </button>
          ),
        )}
        <button type="button" className="ui-pager-step" disabled={current >= pages} onClick={() => onPageChange(current + 1)}>
          Siguiente
          <ChevronRight aria-hidden="true" />
        </button>
      </nav>
      <span className="ui-pager-range" aria-live="polite">
        Mostrando {from}–{to} de {total}
      </span>
    </div>
  );
}
