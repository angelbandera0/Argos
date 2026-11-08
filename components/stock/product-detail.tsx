"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Chip } from "@/components/ui/chip";
import { type Column, DataTable } from "@/components/ui/data-table";
import { DateRangePicker } from "@/components/ui/datepicker";
import { FilterSelect } from "@/components/ui/filter-select";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { MoneyValue } from "@/components/ui/money-value";
import { Pager } from "@/components/ui/pager";
import { Tabs } from "@/components/ui/tabs";
import { ViewState } from "@/components/ui/view-state";
import { Button } from "@/components/ui/button";
import type { Unit } from "@/core/domain/stock";
import { type DetailFilters, MOVEMENT_PAGE_SIZE, MOVEMENT_TYPES, detailQuery, lotOriginLabel, movementTypeLabel, signedQty } from "./product-detail-logic";
import { CostAdjustDialog, CostHistoryDialog, type CostLot } from "./cost-adjust-dialog";
import { AdjustLotDialog } from "./ops-dialogs";
import { ProductConfigTab } from "./product-config-tab";
import { formatStockQty } from "./stock-list-logic";

type Money = { amount: number; currencyId: string } | null | undefined;
export type LotRow = { id: string; receivedAt: string; initialQty: number; remaining: number; origin: string; unitCost: Money; presentation: { entered: string; remaining: string } | null };
export type MovementRow = { id: string; createdAt: string; type: string; qtyDelta: number; reason: string | null; unitCost: Money };
type Currencies = Record<string, { code: string; decimals: number }>;
const FALLBACK = { code: "", decimals: 2 };

export function ProductDetailTabs({
  lots,
  movements,
  total,
  unit,
  costs,
  canAdjust,
  canCorrectCost = false,
  currencies,
  filters,
  config,
}: {
  lots: LotRow[];
  movements: MovementRow[];
  total: number;
  unit: Unit;
  costs: boolean;
  canAdjust: boolean;
  canCorrectCost?: boolean;
  currencies: Currencies;
  filters: DetailFilters;
  config: React.ComponentProps<typeof ProductConfigTab>;
}) {
  const [adjusting, setAdjusting] = useState<LotRow | null>(null);
  const [costDialog, setCostDialog] = useState<{ lot: CostLot; mode: "fix" | "history" } | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const go = (patch: Partial<DetailFilters>) => router.replace(`${pathname}${detailQuery({ ...filters, pagina: 1, ...patch })}`, { scroll: false });
  const cost = (m: Money) => (m === undefined ? null : <MoneyValue value={m ? m.amount : null} currency={(m && currencies[m.currencyId]) || FALLBACK} />);
  const costLot = (r: LotRow): CostLot => ({
    id: r.id,
    label: `Lote ${r.id.slice(0, 8)}`,
    unitCost: r.unitCost ? r.unitCost.amount : null,
    currencyCode: (r.unitCost && currencies[r.unitCost.currencyId]?.code) || "",
  });
  const hasFilters = !!(filters.tipo || filters.desde || filters.hasta);

  const lotColumns: Column<LotRow>[] = [
    { id: "lot", header: "Lote", cell: (r) => <span className="mono">{r.id.slice(0, 8)}</span> },
    { id: "received", header: "Fecha", cell: (r) => <LocalDateTime value={r.receivedAt} /> },
    { id: "presentation", header: "Presentación", cell: (r) => r.presentation?.entered ?? "" },
    { id: "initial", header: "Inicial", align: "end", cell: (r) => <span className="ui-money-value">{formatStockQty(r.initialQty, unit)}</span> },
    { id: "remaining", header: "Restante", align: "end", cell: (r) => (
        <span className="ui-prod-text">
          <span className="ui-money-value">{formatStockQty(r.remaining, unit)}</span>
          {r.presentation?.remaining && <span className="ui-prod-desc">{r.presentation.remaining}</span>}
        </span>
      ),
    },
    { id: "origin", header: "Origen", cell: (r) => <Chip>{lotOriginLabel(r.origin)}</Chip> },
    ...(costs ? [{ id: "cost", header: "Costo unitario", align: "end", cell: (r) => cost(r.unitCost) } satisfies Column<LotRow>] : []),
  ];
  const movColumns: Column<MovementRow>[] = [
    { id: "date", header: "Fecha", cell: (r) => <LocalDateTime value={r.createdAt} /> },
    { id: "type", header: "Tipo", cell: (r) => movementTypeLabel(r.type) },
    { id: "qty", header: "Cantidad", align: "end", cell: (r) => <span className="ui-money-value">{signedQty(r.qtyDelta, formatStockQty(r.qtyDelta, unit))}</span> },
    { id: "reason", header: "Motivo", cell: (r) => r.reason ?? "" },
    ...(costs ? [{ id: "cost", header: "Costo unitario", align: "end", cell: (r) => cost(r.unitCost) } satisfies Column<MovementRow>] : []),
  ];

  return (
    <>
    <Tabs
      aria-label="Detalle del producto"
      value={filters.pestana}
      onValueChange={(v) => go({ pestana: v === "movimientos" || v === "configuracion" ? v : "lotes", tipo: "", desde: "", hasta: "" })}
      items={[
        {
          value: "lotes",
          label: "Lotes",
          content:
            lots.length === 0 ? (
              <ViewState kind="empty" entity="lotes" text="Este producto no tiene lotes con existencia en la ubicación." canCreate={false} />
            ) : (
              <DataTable label="Lotes" columns={lotColumns} rows={lots} getRowId={(r) => r.id} rowActions={canAdjust || costs ? (r) => [...(canAdjust ? [{ label: "Ajustar lote", onSelect: () => setAdjusting(r) }] : []), ...(canCorrectCost ? [{ label: "Corregir costo", onSelect: () => setCostDialog({ lot: costLot(r), mode: "fix" }) }] : []), ...(costs ? [{ label: "Ver ajustes de costo", onSelect: () => setCostDialog({ lot: costLot(r), mode: "history" }) }] : [])] : undefined} />
            ),
        },
        {
          value: "movimientos",
          label: "Movimientos",
          content: (
            <div className="stack">
              <div className="row">
                <FilterSelect
                  label="Tipo"
                  emptyText="Todos"
                  options={Object.entries(MOVEMENT_TYPES).map(([value, label]) => ({ value, label }))}
                  value={filters.tipo}
                  onValueChange={(tipo) => go({ tipo })}
                />
                <DateRangePicker
                  pill={{ label: "Fechas", emptyText: "Todas" }}
                  value={{ from: filters.desde, to: filters.hasta }}
                  onValueChange={(r) => go({ desde: r.from, hasta: r.to })}
                />
              </div>
              {total === 0 ? (
                hasFilters ? (
                  <ViewState kind="no-match" entity="movimientos" action={<Button variant="outline" onClick={() => go({ tipo: "", desde: "", hasta: "" })}>Limpiar filtros</Button>} />
                ) : (
                  <ViewState kind="empty" entity="movimientos" text="Aún no hay movimientos." canCreate={false} />
                )
              ) : (
                <>
                  <DataTable label="Movimientos" columns={movColumns} rows={movements} getRowId={(r) => r.id} />
                  <div className="ui-user-foot">
                    <Pager page={filters.pagina} pageSize={MOVEMENT_PAGE_SIZE} total={total} unit={total === 1 ? "movimiento" : "movimientos"} onPageChange={(pagina) => go({ pagina })} />
                  </div>
                </>
              )}
            </div>
          ),
        },
        { value: "configuracion", label: "Configuración", content: <ProductConfigTab {...config} /> },
      ]}
    />
    {costDialog?.mode === "fix" && <CostAdjustDialog lot={costDialog.lot} onClose={() => setCostDialog(null)} />}
    {costDialog?.mode === "history" && <CostHistoryDialog lot={costDialog.lot} onClose={() => setCostDialog(null)} />}
    {adjusting && <AdjustLotDialog lot={adjusting} unit={unit} onClose={() => setAdjusting(null)} />}
    </>
  );
}
