"use client";

import { useEffect, useState } from "react";
import { type CostAdjustmentRow, type OpActionState, adjustLotCostAction, loadCostAdjustmentsAction } from "@/app/(app)/existencias/ops-actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { formatMoney } from "@/components/ui/spend-logic";
import { Textarea } from "@/components/ui/textarea";
import { ViewState } from "@/components/ui/view-state";
import { canCorrectLotCost, costInputError, costSummary } from "./cost-adjust-logic";

export type CostLot = { id: string; label: string; unitCost: number | null; currencyCode: string };

export function CostAdjustDialog({ lot, onClose }: { lot: CostLot; onClose: () => void }) {
  const [raw, setRaw] = useState("");
  if (!canCorrectLotCost(lot.unitCost)) {
    return (
      <Dialog open title="Corregir costo" description={lot.label} size="md" onClose={onClose} footer={<Button variant="secondary" onClick={onClose}>Cerrar</Button>}>
        <Alert variant="warning">Este lote no tiene costo ni divisa conocidos; no se puede corregir.</Alert>
      </Dialog>
    );
  }
  const old = lot.unitCost as number;
  const error = costInputError(raw);
  const summary = costSummary(old, raw, lot.currencyCode);
  return (
    <FormDialog<OpActionState>
      title="Corregir costo"
      submitLabel="Corregir" pendingLabel="Corrigiendo…"
      description={`${lot.label} · actual ${formatMoney(old, { code: lot.currencyCode, decimals: 6 })}`}
      successMessage="Costo corregido."
      size="md"
      action={adjustLotCostAction}
      onClose={onClose}
    >
      {(state) => (
        <>
          <input type="hidden" name="lotId" value={lot.id} />
          <Field label="Costo nuevo por unidad base" htmlFor="cost-new" error={error ?? undefined} hint="Hasta 6 decimales. Lo ya consumido o trasladado conserva su costo.">
            <Input id="cost-new" name="newUnitCost" type="number" inputMode="decimal" step="any" min={0} required value={raw} onChange={(e) => setRaw(e.target.value)} aria-invalid={error ? true : undefined} />
          </Field>
          {summary && <Alert variant="info" compact>{summary}</Alert>}
          <Field label="Motivo" htmlFor="cost-reason">
            <Textarea id="cost-reason" name="text" maxLength={300} required />
          </Field>
          {state.error && <Alert variant="danger" compact>{state.error}</Alert>}
        </>
      )}
    </FormDialog>
  );
}

export function CostHistoryDialog({ lot, onClose }: { lot: CostLot; onClose: () => void }) {
  const [rows, setRows] = useState<CostAdjustmentRow[] | null>(null);
  useEffect(() => {
    let live = true;
    loadCostAdjustmentsAction(lot.id).then((r) => live && setRows(r));
    return () => {
      live = false;
    };
  }, [lot.id]);
  const c = { code: lot.currencyCode, decimals: 6 };
  return (
    <Dialog open title="Ajustes de costo" description={lot.label} size="lg" onClose={onClose} footer={<Button variant="secondary" onClick={onClose}>Cerrar</Button>}>
      {rows === null ? (
        <ViewState kind="loading" entity="ajustes" />
      ) : rows.length === 0 ? (
        <ViewState kind="empty" entity="ajustes" text="Este lote no tiene ajustes de costo." canCreate={false} />
      ) : (
        <DataTable
          label="Ajustes de costo"
          rows={rows}
          getRowId={(r) => r.id}
          columns={[
            { id: "when", header: "Fecha", cell: (r) => <LocalDateTime value={r.createdAt} /> },
            { id: "old", header: "Anterior", align: "end", cell: (r) => (r.oldUnitCost === null ? "Sin dato" : formatMoney(r.oldUnitCost, c)) },
            { id: "new", header: "Nuevo", align: "end", cell: (r) => formatMoney(r.newUnitCost, c) },
            { id: "reason", header: "Motivo", cell: (r) => r.reason },
            { id: "by", header: "Quién", cell: (r) => r.by },
          ]}
        />
      )}
    </Dialog>
  );
}
