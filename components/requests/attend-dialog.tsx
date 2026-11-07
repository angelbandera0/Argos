"use client";

import { useState } from "react";
import { attendLineAction } from "@/app/(app)/solicitudes/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatStockQty } from "@/components/stock/stock-list-logic";
import type { Unit } from "@/core/domain/stock";
import { KIND_OPTIONS, maxTransfer } from "./inbox-logic";

export function AttendButton({ lineId, productName, remaining, warehouse, unit }: { lineId: string; productName: string; remaining: number; warehouse: number; unit: Unit }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("fulfilled");
  const max = maxTransfer(remaining, warehouse);
  const fmt = (n: number) => String(Math.round(n * 1000) / 1000).replace(".", ",");
  return (
    <>
      <Button size="sm" variant="secondary" onClick={() => setOpen(true)}>
        Atender
      </Button>
      {open && (
        <FormDialog title={`Atender: ${productName}`} description={`Falta decidir ${formatStockQty(remaining, unit)} · En almacén ${formatStockQty(warehouse, unit)}`} action={attendLineAction} successMessage="Decisión guardada." onClose={() => setOpen(false)}>
          {() => (
            <>
              <input type="hidden" name="lineId" value={lineId} />
              <Field label="Decisión" htmlFor={`kind-${lineId}`}>
                <Select id={`kind-${lineId}`} name="kind" options={KIND_OPTIONS} value={kind} onValueChange={(v) => setKind(v ?? "fulfilled")} />
              </Field>
              <Field label={`Cantidad (${unit === "l" ? "L" : unit})`} htmlFor={`qty-${lineId}`} hint={kind === "fulfilled" ? `Máximo a trasladar: ${formatStockQty(max, unit)}. Puede ser una parte; el resto queda sin decidir.` : "Parte de la línea a la que aplica la decisión."}>
                <Input id={`qty-${lineId}`} name="qty" inputMode="decimal" defaultValue={fmt(kind === "fulfilled" ? max || remaining : remaining)} key={kind} />
              </Field>
              {kind === "rejected" && (
                <Field label="Motivo del rechazo" htmlFor={`reason-${lineId}`}>
                  <Textarea id={`reason-${lineId}`} name="reason" rows={2} />
                </Field>
              )}
            </>
          )}
        </FormDialog>
      )}
    </>
  );
}
