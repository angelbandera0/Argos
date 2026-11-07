"use client";

import { useState, useTransition } from "react";
import { adjustAction } from "@/app/(app)/pedidos/[id]/actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CostAdjustDialog, CostHistoryDialog, type CostLot } from "@/components/stock/cost-adjust-dialog";
import { adjustValid, type LotOption } from "./review-logic";

export function AdjustPanel({ orderId, lots, costLots = [] }: { orderId: string; lots: LotOption[]; costLots?: CostLot[] }) {
  const [costDialog, setCostDialog] = useState<{ lot: CostLot; mode: "fix" | "history" } | null>(null);
  const [lotId, setLotId] = useState<string | null>(null);
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState<{ tone: "danger" | "success"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const lot = lots.find((l) => l.lotId === lotId);
  const apply = () =>
    start(async () => {
      const r = await adjustAction({ orderId, lotId, delta: Number(delta), reason });
      setMessage(r.error ? { tone: "danger", text: r.error } : { tone: "success", text: "Corrección aplicada y enlazada al pedido." });
      if (!r.error) {
        setDelta("");
        setReason("");
      }
    });
  return (
    <Card className="stack">
      <h2>Corregir pedido cumplido</h2>
      <p className="muted">El ajuste queda enlazado a los lotes del pedido y no se puede deshacer.</p>
      {message && <Alert variant={message.tone}>{message.text}</Alert>}
      <Field label="Lote" htmlFor="adj-lot">
        <Select id="adj-lot" aria-label="Lote" value={lotId} onValueChange={(v) => setLotId(v)} options={lots.map((l) => ({ value: l.lotId, label: l.label }))} placeholder="Elige el lote" />
      </Field>
      <Field label="Cambio de cantidad (negativo resta)" htmlFor="adj-delta">
        <Input id="adj-delta" type="number" inputMode="decimal" step="any" value={delta} onChange={(e) => setDelta(e.target.value)} />
      </Field>
      <Field label="Motivo" htmlFor="adj-reason">
        <Textarea id="adj-reason" maxLength={300} placeholder="Ej. Un saco estaba roto y se descartó." value={reason} onChange={(e) => setReason(e.target.value)} />
      </Field>
      <div className="row">
        <Button disabled={!adjustValid(lot, Number(delta), reason)} loading={pending} onClick={apply}>
          Aplicar corrección
        </Button>
      </div>
      {costLots.length > 0 && (
        <div className="stack">
          <h2>Corregir costo de un lote</h2>
          <p className="muted">Es un ajuste de valor: lo ya consumido o trasladado conserva su costo.</p>
          {costLots.map((l) => (
            <div key={l.id} className="row">
              <span>{l.label}</span>
              <Button variant="outline" size="sm" onClick={() => setCostDialog({ lot: l, mode: "fix" })}>Corregir costo</Button>
              <Button variant="ghost" size="sm" onClick={() => setCostDialog({ lot: l, mode: "history" })}>Ver ajustes</Button>
            </div>
          ))}
        </div>
      )}
      {costDialog?.mode === "fix" && <CostAdjustDialog lot={costDialog.lot} onClose={() => setCostDialog(null)} />}
      {costDialog?.mode === "history" && <CostHistoryDialog lot={costDialog.lot} onClose={() => setCostDialog(null)} />}
    </Card>
  );
}
