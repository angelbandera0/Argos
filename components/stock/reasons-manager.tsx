"use client";

import { useState, useTransition } from "react";
import { type OpActionState, type ReasonOption, deleteReasonAction, saveReasonAction, setReasonActiveAction } from "@/app/(app)/existencias/ops-actions";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { type Column, DataTable } from "@/components/ui/data-table";
import { Field, Input } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { useToast } from "@/components/ui/toast";
import { ViewState } from "@/components/ui/view-state";

export function ReasonsManager({ reasons }: { reasons: ReasonOption[] }) {
  const toast = useToast();
  const [editing, setEditing] = useState<ReasonOption | "new" | null>(null);
  const [removing, setRemoving] = useState<ReasonOption | null>(null);
  const [pending, start] = useTransition();
  const report = (r: OpActionState, ok: string) => {
    if (r.error || r.nameError) toast.error(r.error ?? r.nameError ?? "");
    else toast.success(ok);
  };

  const columns: Column<ReasonOption>[] = [
    { id: "name", header: "Motivo", cell: (r) => r.name },
    { id: "kind", header: "Tipo", cell: (r) => <Chip>{r.standard ? "Estándar" : "Personalizado"}</Chip> },
    { id: "text", header: "Descripción", cell: (r) => (r.requiresText ? "Obligatoria" : "Opcional") },
    { id: "state", header: "Estado", cell: (r) => <Chip>{r.active ? "Activo" : "Inactivo"}</Chip> },
  ];
  const actions = (r: ReasonOption) => [
    ...(r.standard ? [] : [{ label: "Renombrar", onSelect: () => setEditing(r) }]),
    { label: r.active ? "Desactivar" : "Activar", onSelect: () => start(async () => report(await setReasonActiveAction(r.id, !r.active), r.active ? "Desactivado." : "Activado.")) },
    ...(r.standard ? [] : [{ label: "Eliminar", destructive: true, onSelect: () => setRemoving(r) }]),
  ];

  return (
    <div className="stack">
      <div className="row">
        <Button onClick={() => setEditing("new")}>Añadir motivo</Button>
      </div>
      {reasons.length === 0 ? (
        <ViewState kind="empty" entity="motivos" text="Aún no hay motivos de baja." canCreate={false} />
      ) : (
        <DataTable label="Motivos de baja" columns={columns} rows={reasons} getRowId={(r) => r.id} rowActions={actions} />
      )}
      {editing && (
        <FormDialog<OpActionState>
          title={editing === "new" ? "Añadir motivo" : "Renombrar motivo"}
          successMessage="Guardado."
          action={(prev, f) => saveReasonAction(editing === "new" ? null : editing.id, prev, f)}
          onClose={() => setEditing(null)}
        >
          {(state) => (
            <Field label="Nombre" htmlFor="reason-name" error={state.nameError}>
              <Input id="reason-name" name="name" required maxLength={60} defaultValue={editing === "new" ? "" : editing.name} aria-invalid={state.nameError ? true : undefined} />
            </Field>
          )}
        </FormDialog>
      )}
      <AlertDialog
        open={!!removing}
        onClose={() => setRemoving(null)}
        onConfirm={() =>
          removing &&
          start(async () => {
            report(await deleteReasonAction(removing.id), "Eliminado.");
            setRemoving(null);
          })
        }
        loading={pending}
        title={`¿Eliminar «${removing?.name ?? ""}»?`}
        description="Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
      />
    </div>
  );
}
