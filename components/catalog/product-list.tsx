"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { bulkProductsAction, setProductActiveAction } from "@/app/(app)/catalogo/actions";
import { NAV_ICONS } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { type Column, DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterSelect } from "@/components/ui/filter-select";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pager } from "@/components/ui/pager";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { DeleteProductDialog } from "./delete-product-dialog";
import { type BulkOp, type StatusFilter, bulkSummary, productListQuery, selectedLabel } from "./product-list-logic";

export type ProductListRow = { id: string; name: string; description: string | null; category: string; active: boolean };
export type ProductFilters = { q: string; categoria: string; estado: StatusFilter; pagina: number };

const { Box, Tags } = NAV_ICONS;

export function ProductList({
  rows,
  total,
  pageSize,
  filters,
  counts,
  categories,
  canEdit,
  canDelete,
}: {
  rows: ProductListRow[];
  total: number;
  pageSize: number;
  filters: ProductFilters;
  counts: Record<StatusFilter, number>;
  categories: { value: string; label: string }[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [deleting, setDeleting] = useState<ProductListRow | null>(null);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [target, setTarget] = useState("");
  const [error, setError] = useState<string>();
  const [, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(rows, (cur, change: { ids: string[]; active: boolean }) =>
    cur.map((r) => (change.ids.includes(r.id) ? { ...r, active: change.active } : r)),
  );

  const go = (patch: Partial<ProductFilters>) => {
    setSelected(new Set());
    router.replace(`${pathname}${productListQuery({ ...filters, pagina: 1, ...patch })}`, { scroll: false });
  };

  const toggle = (id: string, active: boolean) =>
    startTransition(async () => {
      setShown({ ids: [id], active });
      const r = await setProductActiveAction(id, active);
      if (r.error) toast.error(r.error);
    });

  const bulk = (op: BulkOp, categoryId?: string) =>
    startTransition(async () => {
      const ids = [...selected];
      if (op !== "category") setShown({ ids, active: op === "activate" });
      const r = await bulkProductsAction(ids, op, categoryId);
      if (r.error && r.done === 0) return setError(r.error);
      setError(undefined);
      setCategoryOpen(false);
      setSelected(new Set());
      (r.failed ? toast.error : toast.success)(bulkSummary(r.done, r.failed), r.failed ? { description: r.error } : undefined);
    });

  const columns: Column<ProductListRow>[] = [
    {
      id: "product",
      header: "Producto",
      cell: (p) => (
        <div className={`ui-prod-cell${p.active ? "" : " ui-prod-off"}`}>
          <span className={`ui-prod-icon${p.active ? "" : " ui-prod-icon-off"}`} aria-hidden="true">
            <Box />
          </span>
          <span className="ui-prod-text">
            <Link href={`/catalogo/productos/${p.id}`}>{p.name}</Link>
            <span className="ui-prod-desc">{p.description || "Sin descripción"}</span>
          </span>
        </div>
      ),
    },
    {
      id: "category",
      header: "Categoría",
      cell: (p) => (
        <Chip>
          <Tags aria-hidden="true" />
          {p.category}
        </Chip>
      ),
    },
    {
      id: "status",
      header: "Estado",
      cell: (p) => (
        <Switch
          className="ui-prod-switch"
          aria-label={`${p.active ? "Desactivar" : "Activar"} ${p.name}`}
          checked={p.active}
          disabled={!canEdit}
          onCheckedChange={(v) => toggle(p.id, v)}
          label={<span className={p.active ? "ui-prod-state-on" : "ui-prod-state-off"}>{p.active ? "Activo" : "Inactivo"}</span>}
        />
      ),
    },
  ];

  return (
    <>
      <ListToolbar
        className="ui-companies-bar"
        submitLabel={false}
        search={{ label: "Buscar producto", placeholder: "Buscar por nombre o descripción", defaultValue: filters.q }}
        extra={
          <>
            {filters.categoria && <input type="hidden" name="categoria" value={filters.categoria} />}
            {filters.estado !== "todos" && <input type="hidden" name="estado" value={filters.estado} />}
            <FilterSelect label="Categoría" emptyText="Todas" options={categories} value={filters.categoria} onValueChange={(categoria) => go({ categoria })} />
            <span className="ui-toolbar-sep" aria-hidden="true" />
            <div className="ui-toolbar-chips" role="group" aria-label="Estado">
              {(["todos", "activos", "inactivos"] as const).map((v) => (
                <Chip key={v} pressed={filters.estado === v} onPressedChange={() => go({ estado: v })}>
                  {v === "todos" ? "Todos" : v === "activos" ? "Activos" : "Inactivos"}
                  <span className="ui-chip-count">{counts[v]}</span>
                </Chip>
              ))}
            </div>
          </>
        }
      />
      {!canEdit && <p className="hint ui-prod-note">Tu rol no permite activar, desactivar ni cambiar la categoría de los productos.</p>}
      <div className="stack">
        <DataTable
          label="Productos"
          columns={columns}
          rows={shown}
          getRowId={(p) => p.id}
          selectable={canEdit}
          selected={selected}
          onSelectedChange={setSelected}
          bulkVariant="danger"
          bulkLabel={selectedLabel}
          bulkActions={
            <>
              <Button variant="secondary" size="sm" onClick={() => bulk("activate")}>Activar</Button>
              <Button variant="secondary" size="sm" onClick={() => bulk("deactivate")}>Desactivar</Button>
              <Button variant="secondary" size="sm" onClick={() => (setError(undefined), setTarget(""), setCategoryOpen(true))}>
                Cambiar categoría
              </Button>
            </>
          }
          rowActionsLabel={(id) => `Opciones de ${shown.find((r) => r.id === id)?.name ?? "producto"}`}
          rowActions={(p) => [
            ...(canEdit ? [{ label: "Editar", onSelect: () => router.push(`/catalogo/productos/${p.id}`) }] : []),
            ...(canDelete ? [{ label: "Eliminar", destructive: true, onSelect: () => setDeleting(p) }] : []),
          ]}
          empty={
            <EmptyState icon="Search" title="Ningún producto coincide con la búsqueda.">
              Prueba con otro nombre o quita algún filtro.
            </EmptyState>
          }
        />
        {total > 0 && (
          <div className="ui-user-foot">
            <Pager page={filters.pagina} pageSize={pageSize} total={total} unit={total === 1 ? "producto" : "productos"} onPageChange={(pagina) => go({ pagina })} />
          </div>
        )}
      </div>
      {deleting && <DeleteProductDialog open productId={deleting.id} name={deleting.name} onClose={() => setDeleting(null)} />}
      <Dialog
        open={categoryOpen}
        onClose={() => setCategoryOpen(false)}
        title="Cambiar categoría"
        description={selectedLabel(selected.size)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCategoryOpen(false)}>Cancelar</Button>
            <Button disabled={!target} onClick={() => bulk("category", target)}>Cambiar categoría</Button>
          </>
        }
      >
        <Select aria-label="Categoría nueva" options={categories} value={target} onValueChange={(v) => setTarget(v ?? "")} placeholder="Elige una categoría" />
        {error && <Alert variant="danger">{error}</Alert>}
      </Dialog>
    </>
  );
}
