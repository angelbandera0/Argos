"use client";

import { Button } from "./button";

/** One row above the table: optional search · separator · filter pills · «Limpiar filtros» (pass `onClear` only when a filter is active). */
export function FilterBar({
  label = "Filtros",
  search,
  onClear,
  children,
}: {
  label?: string;
  search?: React.ReactNode;
  onClear?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="filter-bar" role="group" aria-label={label}>
      {search && (
        <>
          {search}
          <span className="filter-bar-sep" aria-hidden="true" />
        </>
      )}
      {children}
      {onClear && (
        <Button variant="ghost" size="sm" className="filter-bar-clear" onClick={onClear}>
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
