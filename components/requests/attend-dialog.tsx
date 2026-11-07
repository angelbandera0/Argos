"use client";

import { useState } from "react";
import { attendLineAction } from "@/app/(app)/solicitudes/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { type LotChoice, type LotCurrency, LotPicker } from "@/components/stock/lot-picker";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatStockQty } from "@/components/stock/stock-list-logic";
import type { Unit } from "@/core/domain/stock";
import { KIND_OPTIONS, maxTransfer } from "./inbox-logic";

export function AttendButton({ lineId, productId, warehouseId, canChooseLot, currencies, productName, remaining, warehouse, unit }: { lineId: string; productId: string; warehouseId: string; canChooseLot: boolean; currencies: LotCurrency[]; productName: string; remaining: number; warehouse: number; unit: Unit }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("fulfilled");
  const [choice, setChoice] = useState<LotChoice>({ picks: [], reason: "" });
  const max = maxTransfer(remaining, warehouse);
  const fmt = (n: number) => String(Math.round(n * 1000) / 1000).replace(".", ",");
  const [amount, setAmount] = useState(fmt(max || remaining));
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
                <Select id={`kind-${lineId}`} name="kind" options={KIND_OPTIONS} value={kind} onValueChange={(v) => { const k = v ?? "fulfilled"; setKind(k); setAmount(fmt(k === "fulfilled" ? max || remaining : remaining)); setChoice({ picks: [], reason: "" }); }} />
              </Field>
              <Field label={`Cantidad (${unit === "l" ? "L" : unit})`} htmlFor={`qty-${lineId}`} hint={kind === "fulfilled" ? `Máximo a trasladar: ${formatStockQty(max, unit)}. Puede ser una parte; el resto queda sin decidir.` : "Parte de la línea a la que aplica la decisión."}>
                <Input id={`qty-${lineId}`} name="qty" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </Field>
              {kind === "fulfilled" && warehouseId && (
                <>
                  <LotPicker id={`lot-${lineId}`} productId={productId} locationId={warehouseId} amount={amount} unit="base" baseUnit={unit} canChooseLot={canChooseLot} currencies={currencies} onChange={setChoice} />
                  <input type="hidden" name="picks" value={choice.picks.length ? JSON.stringify(choice.picks) : ""} />
                  <input type="hidden" name="deviation" value={choice.reason} />
                </>
              )}
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
