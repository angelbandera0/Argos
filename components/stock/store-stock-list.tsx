"use client";

import { useNavRouter } from "@/components/ui/use-nav-router";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { saveMinimumAction } from "@/app/(app)/existencias/[productId]/actions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buttonClass } from "@/components/ui/button-class";
import { Chip } from "@/components/ui/chip";
import { EntityCard } from "@/components/ui/entity-card";
import { Field, Input } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pager } from "@/components/ui/pager";
import { StatusBadge } from "@/components/ui/status-badge";
import { ViewState } from "@/components/ui/view-state";
import type { StockStatus } from "@/core/domain/stock";
import { EntryButton } from "./entry-button";
import type { EntryCurrency, EntryProduct } from "./entry-dialog";
import { hasMinimum } from "./product-config-logic";
import { type StatusFilter, type StockFilters, formatStockQty, minimumLabel, shortfallLabel, statusParam, stockListQuery } from "./stock-list-logic";
import type { StockRow } from "./stock-list";

const STATUS_LABEL: Record<StatusFilter, string> = { todos: "Todas", normal: "Normal", low: "Bajo", out: "Agotado" };

export function StoreStockList({
  rows,
  total,
  counts,
  pageSize,
  filters,
  location,
  canMinimums,
  canDirect,
  canRequest,
  entry,
  costs,
}: {
  rows: StockRow[];
  total: number;
  counts: Record<StockStatus, number>;
  pageSize: number;
  filters: StockFilters;
  location: string;
  canMinimums: boolean;
  canDirect: boolean;
  canRequest: boolean;
  costs: boolean;
  entry: { locationId: string; products: EntryProduct[]; currencies: EntryCurrency[] };
}) {
  const router = useNavRouter();
  const pathname = usePathname();
  const [editing, setEditing] = useState<StockRow | null>(null);
  const go = (patch: Partial<StockFilters>) => router.replace(`${pathname}${stockListQuery({ ...filters, pagina: 1, ...patch })}`, { scroll: false });
  const all = counts.normal + counts.low + counts.out;
  const countOf = (s: StatusFilter) => (s === "todos" ? all : counts[s]);
  const hasFilters = !!(filters.q || filters.estado !== "todos");

  if (all === 0) {
    return <ViewState kind="empty" entity="existencias" text={canDirect ? "Registra una entrada directa para empezar." : "Cuando se registren, aparecerán aquí."} canCreate={false} />;
  }

  return (
    <>
      {canRequest && counts.low + counts.out > 0 && (
        <Link className={buttonClass("secondary", "md")} href="/solicitudes/nueva?reponer=1">
          Solicitar reposición de los agotados
        </Link>
      )}
      <ListToolbar
        submitLabel={false}
        search={{ label: "Buscar producto", placeholder: "Buscar producto", defaultValue: filters.q }}
        extra={
          <>
            {filters.estado !== "todos" && <input type="hidden" name="estado" value={statusParam(filters.estado)} />}
            <div className="ui-toolbar-chips" role="group" aria-label="Estado">
              {(["todos", "normal", "low", "out"] as const).map((s) => (
                <Chip key={s} pressed={filters.estado === s} onPressedChange={() => go({ estado: s })}>
                  {STATUS_LABEL[s]}
                  <span className="ui-chip-count">{countOf(s)}</span>
                </Chip>
              ))}
            </div>
          </>
        }
      />
      {total === 0 && hasFilters ? (
        <ViewState kind="no-match" entity="existencias" action={<Button variant="outline" onClick={() => go({ q: "", estado: "todos" })}>Quitar filtros</Button>} />
      ) : (
        <div className="stack" aria-label={`Existencias de ${location}`}>
          {rows.map((r) => (
            <EntityCard
              key={r.productId}
              avatar={r.name.charAt(0).toUpperCase()}
              title={r.name}
              subtitle={r.category ?? undefined}
              badge={<StatusBadge family="stock" status={r.status} />}
              data={[
                { label: "Existencia", value: r.presentation ? `${r.presentation.main} · ${r.presentation.base}` : formatStockQty(r.quantity, r.unit) },
                { label: "Mínimo", value: minimumLabel(r.minimum, r.unit) },
              ]}
              actions={
                (canMinimums || canDirect) && (
                  <>
                    {shortfallLabel(r.quantity, r.minimum, r.unit) && <p className="hint">{shortfallLabel(r.quantity, r.minimum, r.unit)}</p>}
                    {canMinimums && (
                      <Button variant="outline" onClick={() => setEditing(r)}>
                        {hasMinimum(r.minimum) ? "Editar mínimo" : "Fijar mínimo"}
                      </Button>
                    )}
                    {canDirect && <EntryButton kind="direct" variant="secondary" {...entry} productId={r.productId} costs={costs} />}
                  </>
                )
              }
            />
          ))}
          <div className="ui-user-foot">
            <Pager page={filters.pagina} pageSize={pageSize} total={total} unit={total === 1 ? "producto" : "productos"} onPageChange={(pagina) => go({ pagina })} />
          </div>
        </div>
      )}
      {editing && (
        <FormDialog
          title={`Mínimo de ${editing.name}`}
          successMessage="Guardado."
          action={(prev, f) => saveMinimumAction(editing.productId, entry.locationId, prev, f)}
          onClose={() => setEditing(null)}
        >
          {() => (
            <Field label={`Mínimo (${editing.unit === "l" ? "L" : editing.unit})`} htmlFor="minimum" hint="0 o vacío quita el mínimo.">
              <Input id="minimum" name="minimum" type="number" inputMode="decimal" min={0} step="any" defaultValue={hasMinimum(editing.minimum) ? (editing.minimum ?? undefined) : ""} />
            </Field>
          )}
        </FormDialog>
      )}
    </>
  );
}
