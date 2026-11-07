"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { WriteOffButton } from "./ops-dialogs";
import { TransferButton } from "./transfer-button";
import { EntryButton } from "./entry-button";
import type { EntryCurrency, EntryProduct } from "./entry-dialog";
import { type Column, DataTable } from "@/components/ui/data-table";
import { FilterSelect } from "@/components/ui/filter-select";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { MoneyValue } from "@/components/ui/money-value";
import { Pager } from "@/components/ui/pager";
import { StatTile } from "@/components/ui/stat-tile";
import { StatusBadge } from "@/components/ui/status-badge";
import { ViewState } from "@/components/ui/view-state";
import type { StockStatus, Unit } from "@/core/domain/stock";
import {
  type StatusFilter,
  type StockFilters,
  formatStockQty,
  minimumLabel,
  statusParam,
  stockListQuery,
  sumByCurrency,
  unknownCostLabel,
} from "./stock-list-logic";

type Money = { currencyId: string; amount: number };
export type StockRow = {
  productId: string;
  name: string;
  category: string | null;
  quantity: number;
  unit: Unit;
  status: StockStatus;
  minimum: number | null;
  avgCost: Money | null;
  value: Money[];
  unknownCost: boolean;
};
type Currencies = Record<string, { code: string; decimals: number }>;

const FALLBACK = { code: "", decimals: 2 };
const STATUS_LABEL: Record<StatusFilter, string> = { todos: "Todos", normal: "Normal", low: "Bajo", out: "Agotado" };

export function StockList({
  rows,
  total,
  counts,
  pageSize,
  filters,
  locations,
  categories,
  location,
  costs,
  currencies,
  inventory,
  canEntry,
  canTransfer,
  canWriteOff,
  canDirect,
  isWarehouse,
  entry,
  transfer,
}: {
  rows: StockRow[];
  total: number;
  counts: Record<StockStatus, number>;
  pageSize: number;
  filters: StockFilters;
  locations: { value: string; label: string }[];
  categories: { value: string; label: string }[];
  location: string;
  costs: boolean;
  currencies: Currencies;
  inventory?: { values: { currencyId: string; value: number }[]; unknownProducts: number };
  canEntry: boolean;
  canTransfer: boolean;
  canWriteOff: boolean;
  canDirect: boolean;
  isWarehouse: boolean;
  entry: { locationId: string; products: EntryProduct[]; currencies: EntryCurrency[] };
  transfer: React.ComponentProps<typeof TransferButton>;
}) {
  const entryKind = isWarehouse ? "initial" : "direct";
  const canEnter = isWarehouse ? canEntry : canDirect;
  const entryButton = canEnter ? <EntryButton kind={entryKind} {...entry} costs={costs} /> : undefined;
  const router = useRouter();
  const pathname = usePathname();
  const go = (patch: Partial<StockFilters>) => router.replace(`${pathname}${stockListQuery({ ...filters, pagina: 1, ...patch })}`, { scroll: false });
  const cur = (id: string) => currencies[id] ?? FALLBACK;
  const all = counts.normal + counts.low + counts.out;
  const countOf = (s: StatusFilter) => (s === "todos" ? all : counts[s]);
  const hasFilters = !!(filters.q || filters.categoria || filters.estado !== "todos");

  if (all === 0) {
    return (
      <ViewState
        kind="empty"
        entity="existencias"
        text={canEnter ? "Registra la entrada inicial para empezar." : "Cuando se registren, aparecerán aquí."}
        canCreate={canEnter}
        action={entryButton}
      />
    );
  }

  const columns: Column<StockRow>[] = [
    {
      id: "product",
      header: "Producto",
      cell: (r) => (
        <span className="ui-prod-text">
          <Link href={`/existencias/${r.productId}${stockListQuery({ ubicacion: filters.ubicacion })}`}>{r.name}</Link>
          <span className="ui-prod-desc">Unidad base: {r.unit === "l" ? "L" : r.unit}</span>
        </span>
      ),
    },
    { id: "category", header: "Categoría", cell: (r) => (r.category ? <Chip>{r.category}</Chip> : null) },
    {
      id: "qty",
      header: "Existencia",
      align: "end",
      cell: (r) => <span className={`ui-money-value${r.quantity === 0 ? " ui-stock-zero" : ""}`}>{formatStockQty(r.quantity, r.unit)}</span>,
    },
    { id: "status", header: "Estado", cell: (r) => <StatusBadge family="stock" status={r.status} /> },
    { id: "min", header: "Mínimo", align: "end", cell: (r) => <span className="ui-money-value">{minimumLabel(r.minimum, r.unit)}</span> },
    ...(costs
      ? ([
          {
            id: "avg",
            header: "Costo promedio",
            align: "end",
            cell: (r) => <MoneyValue value={r.avgCost?.amount ?? null} currency={cur(r.avgCost?.currencyId ?? "")} />,
          },
          {
            id: "value",
            header: "Valor",
            align: "end",
            cell: (r) => (
              <>
                {r.value.map((v) => (
                  <MoneyValue key={v.currencyId} value={v.amount} currency={cur(v.currencyId)} />
                ))}
                {(r.unknownCost || r.value.length === 0) && r.quantity > 0 && <MoneyValue value={null} currency={FALLBACK} />}
              </>
            ),
          },
        ] satisfies Column<StockRow>[])
      : []),
  ];

  const noCost = inventory && unknownCostLabel(inventory.unknownProducts);
  return (
    <>
      <div className="ui-stat-grid">
        <StatTile icon="Box" label="Productos" value={all} />
        <StatTile dot="warning" label="Bajos" value={counts.low} />
        <StatTile dot="ink" label="Agotados" value={counts.out} />
        {inventory && (
          <StatTile
            icon="Coins"
            label="Valor del inventario"
            value={
              sumByCurrency(inventory.values).length === 0 ? (
                <MoneyValue value={null} currency={FALLBACK} />
              ) : (
                sumByCurrency(inventory.values).map((v) => <MoneyValue key={v.currencyId} value={v.amount} currency={cur(v.currencyId)} />)
              )
            }
          />
        )}
      </div>
      {noCost && <p className="hint">{noCost}; no entran en el valor del inventario.</p>}
      <ListToolbar
        submitLabel={false}
        search={{ label: "Buscar producto", placeholder: "Buscar producto", defaultValue: filters.q }}
        primary={
          isWarehouse && (canEntry || canTransfer || canWriteOff) ? (
            <>
              {canTransfer && <TransferButton {...transfer} />}
              {canWriteOff && <WriteOffButton locationId={transfer.fromLocationId} products={transfer.products} canChooseLot={transfer.canChooseLot} currencies={transfer.currencies} />}
              {entryButton}
            </>
          ) : entryButton
        }
        extra={
          <>
            {filters.ubicacion && <input type="hidden" name="ubicacion" value={filters.ubicacion} />}
            {filters.categoria && <input type="hidden" name="categoria" value={filters.categoria} />}
            {filters.estado !== "todos" && <input type="hidden" name="estado" value={statusParam(filters.estado)} />}
            {locations.length > 1 && (
              <FilterSelect label="Ubicación" emptyText={location} options={locations} value={filters.ubicacion} onValueChange={(ubicacion) => go({ ubicacion, categoria: "", estado: "todos" })} />
            )}
            {categories.length > 0 && <FilterSelect label="Categoría" emptyText="Todas" options={categories} value={filters.categoria} onValueChange={(categoria) => go({ categoria })} />}
            <span className="ui-toolbar-sep" aria-hidden="true" />
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
        <ViewState kind="no-match" entity="existencias" action={<Button variant="outline" onClick={() => go({ q: "", categoria: "", estado: "todos" })}>Limpiar filtros</Button>} />
      ) : (
        <div className="stack">
          <DataTable label={`Existencias de ${location}`} columns={columns} rows={rows} getRowId={(r) => r.productId} />
          <div className="ui-user-foot">
            <Pager page={filters.pagina} pageSize={pageSize} total={total} unit={total === 1 ? "producto" : "productos"} onPageChange={(pagina) => go({ pagina })} />
          </div>
        </div>
      )}
    </>
  );
}
