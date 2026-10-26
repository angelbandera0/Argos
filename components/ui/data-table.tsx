"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Menu as BaseMenu } from "@base-ui/react/menu";
import { Check, Minus } from "lucide-react";
import { Fragment, useState } from "react";
import { NAV_ICONS } from "@/components/icons";
import { buttonClass } from "./button-class";
import {
  ariaSort,
  clampPage,
  nextSort,
  pageCount,
  pageItems,
  pageSlice,
  rangeLabel,
  selectionState,
  sortRows,
  toggleRow,
  togglePage,
  type Sort,
} from "./data-table-utils";
import { Select } from "./select";
import { Skeleton } from "./skeleton";

const { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Ellipsis } = NAV_ICONS;

export type Column<T> = {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "start" | "end" | "center";
  sortValue?: (row: T) => string | number | null | undefined;
};

export type RowAction = { label: string; onSelect: () => void; destructive?: boolean };

const NO_SELECTION: ReadonlySet<string> = new Set();

function useControlled<V>(value: V, onChange?: (v: V) => void): [V, (v: V) => void] {
  const [inner, setInner] = useState(value);
  return [onChange ? value : inner, (v) => (setInner(v), onChange?.(v))];
}

function RowMenu({ label, actions }: { label: string; actions: RowAction[] }) {
  return (
    <BaseMenu.Root>
      <BaseMenu.Trigger className={buttonClass("icon", "sm")} aria-label={label} title={label}>
        <Ellipsis aria-hidden="true" />
      </BaseMenu.Trigger>
      <BaseMenu.Portal>
        <BaseMenu.Positioner className="ui-positioner" align="end" sideOffset={8}>
          <BaseMenu.Popup className="menu-popup">
            {actions.map((a, i) => (
              <Fragment key={a.label}>
                {a.destructive && i > 0 && !actions[i - 1].destructive && <BaseMenu.Separator className="menu-sep" />}
                <BaseMenu.Item className={`menu-item${a.destructive ? " menu-item-danger" : ""}`} onClick={a.onSelect}>
                  {a.label}
                </BaseMenu.Item>
              </Fragment>
            ))}
          </BaseMenu.Popup>
        </BaseMenu.Positioner>
      </BaseMenu.Portal>
    </BaseMenu.Root>
  );
}

function RowCheck({ label, ...props }: BaseCheckbox.Root.Props & { label: string }) {
  return (
    <BaseCheckbox.Root className="ui-check" aria-label={label} {...props}>
      <BaseCheckbox.Indicator className="ui-check-mark">
        {props.indeterminate ? <Minus aria-hidden="true" /> : <Check aria-hidden="true" />}
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  label,
  density = "comfortable",
  stickyHeader = false,
  sort: sortProp = null,
  onSortChange,
  selectable = false,
  selected: selectedProp = NO_SELECTION,
  onSelectedChange,
  bulkActions,
  rowActions,
  rowActionsLabel = (id) => `Acciones de la fila ${id}`,
  page: pageProp = 1,
  onPageChange,
  pageSize: sizeProp = 0,
  onPageSizeChange,
  pageSizes = [8, 25, 50],
  total,
  loading = false,
  empty,
}: {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  label: string;
  density?: "comfortable" | "compact";
  stickyHeader?: boolean;
  sort?: Sort | null;
  onSortChange?: (sort: Sort | null) => void;
  selectable?: boolean;
  selected?: ReadonlySet<string>;
  onSelectedChange?: (selected: ReadonlySet<string>) => void;
  bulkActions?: React.ReactNode;
  rowActions?: (row: T) => RowAction[];
  rowActionsLabel?: (id: string) => string;
  page?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizes?: number[];
  total?: number;
  loading?: boolean;
  empty?: React.ReactNode;
}) {
  const [sort, setSort] = useControlled<Sort | null>(sortProp, onSortChange);
  const [selected, setSelected] = useControlled<ReadonlySet<string>>(selectedProp, onSelectedChange);
  const [page, setPage] = useControlled(pageProp, onPageChange);
  const [size, setSize] = useControlled(sizeProp, onPageSizeChange);

  const sortValue = columns.find((c) => c.id === sort?.id)?.sortValue;
  const ordered = !onSortChange && sort && sortValue ? sortRows(rows, sortValue, sort.dir) : rows;
  const paged = size > 0;
  const count = total ?? ordered.length;
  const pages = paged ? pageCount(count, size) : 1;
  const current = clampPage(page, pages);
  const visible = paged && total === undefined ? pageSlice(ordered, current, size) : ordered;
  const ids = visible.map(getRowId);
  const state = selectionState(ids, selected);
  const colSpan = columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0);
  const skeletonRows = Array.from({ length: paged ? Math.min(size, 5) : 5 });

  return (
    <div className={`dt dt-${density}${stickyHeader ? " dt-sticky" : ""}`} aria-busy={loading || undefined}>
      {selected.size > 0 && (
        <div className="dt-bulk" role="region" aria-label="Acciones en lote">
          <strong>{selected.size === 1 ? "1 seleccionado" : `${selected.size} seleccionados`}</strong>
          <button type="button" className="dt-bulk-clear" onClick={() => setSelected(NO_SELECTION)}>
            Quitar selección
          </button>
          <span className="dt-spacer" />
          {bulkActions}
        </div>
      )}
      <div className="dt-scroll" role="region" aria-label={label} tabIndex={0}>
        <table>
          <caption className="sr-only">{label}</caption>
          <thead>
            <tr>
              {selectable && (
                <th scope="col" className="dt-check">
                  <RowCheck
                    label="Seleccionar todas las filas de la página"
                    checked={state === "all"}
                    indeterminate={state === "some"}
                    disabled={loading || ids.length === 0}
                    onCheckedChange={() => setSelected(togglePage(selected, ids))}
                  />
                </th>
              )}
              {columns.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  className={`overline dt-${c.align ?? "start"}`}
                  aria-sort={c.sortValue || onSortChange ? ariaSort(sort, c.id) : undefined}
                >
                  {c.sortValue || onSortChange ? (
                    <button
                      type="button"
                      className="dt-sort"
                      onClick={() => (setSort(nextSort(sort, c.id)), setPage(1))}
                    >
                      {c.header}
                      {sort?.id === c.id ? (
                        sort.dir === "asc" ? <ArrowUp aria-hidden="true" data-on="" /> : <ArrowDown aria-hidden="true" data-on="" />
                      ) : (
                        <ArrowUpDown aria-hidden="true" />
                      )}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
              {rowActions && (
                <th scope="col" className="dt-actions">
                  <span className="sr-only">Acciones</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              skeletonRows.map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: colSpan }, (_, j) => (
                    <td key={j}>
                      <Skeleton variant="text" />
                    </td>
                  ))}
                </tr>
              ))
            ) : visible.length === 0 ? (
              <tr className="dt-empty">
                <td colSpan={colSpan}>{empty ?? <p className="muted">Sin resultados.</p>}</td>
              </tr>
            ) : (
              visible.map((row) => {
                const id = getRowId(row);
                const isSelected = selected.has(id);
                return (
                  <tr key={id} aria-selected={selectable ? isSelected : undefined} data-selected={isSelected || undefined}>
                    {selectable && (
                      <td className="dt-check">
                        <RowCheck
                          label={`Seleccionar fila ${id}`}
                          checked={isSelected}
                          onCheckedChange={() => setSelected(toggleRow(selected, id))}
                        />
                      </td>
                    )}
                    {columns.map((c) => (
                      <td key={c.id} className={`dt-${c.align ?? "start"}`}>
                        {c.cell(row)}
                      </td>
                    ))}
                    {rowActions && (
                      <td className="dt-actions">
                        <RowMenu label={rowActionsLabel(id)} actions={rowActions(row)} />
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      {loading && <span className="sr-only" role="status">Cargando…</span>}
      {paged && (
        <div className="dt-foot">
          <div className="dt-size">
            <span className="hint">Filas por página</span>
            <Select
              aria-label="Filas por página"
              options={pageSizes.map((n) => ({ value: String(n), label: String(n) }))}
              value={String(size)}
              onValueChange={(v) => v && (setSize(Number(v)), setPage(1))}
            />
          </div>
          <span className="hint" aria-live="polite">{rangeLabel(current, size, count)}</span>
          <nav className="dt-pager" aria-label="Paginación">
            <button
              type="button"
              className="dt-page dt-page-nav"
              aria-label="Página anterior"
              disabled={current <= 1}
              onClick={() => setPage(current - 1)}
            >
              <ChevronLeft aria-hidden="true" />
            </button>
            {pageItems(current, pages).map((n, i) =>
              n === "gap" ? (
                <span key={`g${i}`} className="dt-gap" aria-hidden="true">…</span>
              ) : (
                <button
                  key={n}
                  type="button"
                  className="dt-page"
                  aria-label={`Página ${n}`}
                  aria-current={n === current ? "page" : undefined}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ),
            )}
            <button
              type="button"
              className="dt-page dt-page-nav"
              aria-label="Página siguiente"
              disabled={current >= pages}
              onClick={() => setPage(current + 1)}
            >
              <ChevronRight aria-hidden="true" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
