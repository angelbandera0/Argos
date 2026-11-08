"use client";

import { useState, useTransition } from "react";
import {
  type ConfigActionState,
  changeBaseUnitAction,
  deleteItemAction,
  saveMinimumAction,
  saveMovementUnitAction,
  savePresentationAction,
  setItemActiveAction,
} from "@/app/(app)/existencias/[productId]/actions";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Card } from "@/components/ui/card";
import { type Column, DataTable } from "@/components/ui/data-table";
import { Select } from "@/components/ui/select";
import { Field, Input } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { ViewState } from "@/components/ui/view-state";
import type { Unit } from "@/core/domain/stock";
import { baseUnitOptions, BASE_UNIT_LOCKED_TEXT, contentLabel, hasMinimum } from "./product-config-logic";
import { STORABLE_LOCKED_TEXT } from "./entry-logic";
import { minimumLabel } from "./stock-list-logic";

export type ConfigItem = { id: string; name: string; value: number; active: boolean };
export type MinimumRow = { locationId: string; name: string; minimum: number | null };
type Kind = "presentation" | "unit";
type Editing = { kind: Kind; item: ConfigItem | null } | { minimum: MinimumRow } | null;

const nf = (n: number) => new Intl.NumberFormat("es", { maximumFractionDigits: 3 }).format(n);

export function ProductConfigTab({
  productId,
  baseUnit,
  storable,
  baseUnitLocked,
  presentations,
  movementUnits,
  minimums,
  canUnits,
  canMinimums,
}: {
  productId: string;
  baseUnit: Unit;
  storable: boolean;
  baseUnitLocked: boolean;
  presentations: ConfigItem[];
  movementUnits: ConfigItem[];
  minimums: MinimumRow[];
  canUnits: boolean;
  canMinimums: boolean;
}) {
  const toast = useToast();
  const [editing, setEditing] = useState<Editing>(null);
  const [removing, setRemoving] = useState<{ kind: Kind; item: ConfigItem } | null>(null);
  const [pending, start] = useTransition();
  const close = () => setEditing(null);

  const report = (r: ConfigActionState, ok: string) => {
    if (r.error || r.nameError) toast.error(r.error ?? r.nameError ?? "");
    else toast.success(ok);
  };
  const toggle = (kind: Kind, item: ConfigItem) =>
    start(async () => report(await setItemActiveAction(productId, kind, item.id, !item.active), item.active ? "Desactivada." : "Activada."));
  const remove = () =>
    removing &&
    start(async () => {
      report(await deleteItemAction(productId, removing.kind, removing.item.id), "Eliminada.");
      setRemoving(null);
    });

  const itemColumns = (kind: Kind, valueHeader: string, valueText: (i: ConfigItem) => string): Column<ConfigItem>[] => [
    { id: "name", header: "Nombre", cell: (i) => i.name },
    { id: "value", header: valueHeader, align: "end", cell: (i) => <span className="ui-money-value">{valueText(i)}</span> },
    { id: "state", header: "Estado", cell: (i) => <Chip>{i.active ? "Activa" : "Inactiva"}</Chip> },
  ];
  const itemActions = (kind: Kind) => (i: ConfigItem) => [
    { label: "Editar", onSelect: () => setEditing({ kind, item: i }) },
    { label: i.active ? "Desactivar" : "Activar", onSelect: () => toggle(kind, i) },
    { label: "Eliminar", destructive: true, onSelect: () => setRemoving({ kind, item: i }) },
  ];
  const section = (kind: Kind, title: string, addLabel: string, items: ConfigItem[], valueHeader: string, valueText: (i: ConfigItem) => string) => (
    <Card>
      <div className="stack">
        <div className="row">
          <h3>{title}</h3>
          {canUnits && <Button variant="secondary" size="sm" onClick={() => setEditing({ kind, item: null })}>{addLabel}</Button>}
        </div>
        {items.length === 0 ? (
          <ViewState kind="empty" entity="elementos" text="Aún no hay elementos." canCreate={false} />
        ) : (
          <DataTable label={title} columns={itemColumns(kind, valueHeader, valueText)} rows={items} getRowId={(i) => i.id} rowActions={canUnits ? itemActions(kind) : undefined} />
        )}
      </div>
    </Card>
  );

  const minColumns: Column<MinimumRow>[] = [
    { id: "location", header: "Ubicación", cell: (r) => r.name },
    { id: "minimum", header: "Mínimo", align: "end", cell: (r) => <span className="ui-money-value">{minimumLabel(r.minimum, baseUnit)}</span> },
  ];

  return (
    <div className="stack">
      <Card>
        <div className="stack">
          {canUnits && (
            <Switch
              label="Se almacena en almacén"
              description={storable && baseUnitLocked ? STORABLE_LOCKED_TEXT : "Permite registrar existencias de este producto."}
              checked={storable}
              disabled={(storable && baseUnitLocked) || pending}
              onCheckedChange={(c) => start(async () => report(await changeBaseUnitAction(productId, c, baseUnit), c ? "Producto activado para almacén." : "Producto desactivado para almacén."))}
            />
          )}
          <h3>Unidad base</h3>
          <p><strong>{baseUnit === "l" ? "L" : baseUnit}</strong> <span className="hint">Cómo se cuenta la existencia.</span></p>
          {canUnits && (
            <Field label="Cambiar unidad base" htmlFor="base-unit" hint={baseUnitLocked ? BASE_UNIT_LOCKED_TEXT : "Solo unidades del mismo tipo. Las presentaciones y mínimos no se convierten."}>
              <Select
                id="base-unit"
                options={baseUnitOptions(baseUnit)}
                value={baseUnit}
                disabled={baseUnitLocked || pending}
                onValueChange={(v) => v && v !== baseUnit && start(async () => report(await changeBaseUnitAction(productId, storable, v), "Unidad base actualizada."))}
              />
            </Field>
          )}
          {!canUnits && baseUnitLocked && <p className="hint">{BASE_UNIT_LOCKED_TEXT}</p>}
        </div>
      </Card>
      {section("presentation", "Presentaciones de compra", "Añadir presentación", presentations, "Contenido", (i) => contentLabel(i.value, baseUnit))}
      {section("unit", "Unidades de movimiento", "Añadir unidad", movementUnits, "Equivalencia", (i) => `${nf(i.value)} ${baseUnit === "l" ? "L" : baseUnit}`)}
      <Card>
        <div className="stack">
          <h3>Mínimos por ubicación</h3>
          <p className="hint">Con la existencia igual o por debajo del mínimo, el producto se marca como Bajo. Sin mínimo: déjalo vacío o en 0.</p>
          <DataTable
            label="Mínimos por ubicación"
            columns={minColumns}
            rows={minimums}
            getRowId={(r) => r.locationId}
            rowActions={canMinimums ? (r) => [{ label: hasMinimum(r.minimum) ? "Editar mínimo" : "Fijar mínimo", onSelect: () => setEditing({ minimum: r }) }] : undefined}
          />
        </div>
      </Card>

      {editing && "kind" in editing && (
        <FormDialog<ConfigActionState>
          title={`${editing.item ? "Editar" : "Añadir"} ${editing.kind === "presentation" ? "presentación" : "unidad de movimiento"}`}
          successMessage="Guardado."
          action={(prev, f) => (editing.kind === "presentation" ? savePresentationAction : saveMovementUnitAction)(productId, editing.item?.id ?? null, prev, f)}
          onClose={close}
        >
          {(state) => (
            <>
              <Field label="Nombre" htmlFor="name" error={state.nameError}>
                <Input id="name" name="name" required maxLength={60} defaultValue={editing.item?.name} aria-invalid={state.nameError ? true : undefined} />
              </Field>
              <Field label={editing.kind === "presentation" ? `Contenido (${baseUnit})` : `Equivalencia (${baseUnit})`} htmlFor="amount">
                <Input id="amount" name={editing.kind === "presentation" ? "content" : "equivalence"} type="number" inputMode="decimal" min={0} step="any" required defaultValue={editing.item?.value} />
              </Field>
            </>
          )}
        </FormDialog>
      )}
      {editing && "minimum" in editing && (
        <FormDialog<ConfigActionState>
          title={`Mínimo en ${editing.minimum.name}`}
          successMessage="Guardado."
          action={(prev, f) => saveMinimumAction(productId, editing.minimum.locationId, prev, f)}
          onClose={close}
        >
          {() => (
            <Field label={`Mínimo (${baseUnit})`} htmlFor="minimum" hint="0 o vacío quita el mínimo.">
              <Input id="minimum" name="minimum" type="number" inputMode="decimal" min={0} step="any" defaultValue={hasMinimum(editing.minimum.minimum) ? (editing.minimum.minimum ?? undefined) : ""} />
            </Field>
          )}
        </FormDialog>
      )}
      <AlertDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={remove}
        loading={pending}
        loadingLabel="Eliminando…"
        title={`¿Eliminar «${removing?.item.name ?? ""}»?`}
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
      />
    </div>
  );
}
