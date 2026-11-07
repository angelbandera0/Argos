"use client";

import { useState, useTransition } from "react";
import { purchaseAction } from "@/app/(app)/pedidos/[id]/actions";
import { Alert } from "@/components/ui/alert";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { MoneyValue } from "@/components/ui/money-value";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SpendSummary } from "@/components/ui/spend-summary";
import type { Currency } from "@/components/ui/spend-logic";
import { draftIssue, draftsComparison, purchaseReady, spentByProduct, toPurchaseLines, type PurchaseDraft } from "./purchase-logic";

export type PurchaseLine = { id: string; name: string; qty: number; unit: string };

export function PurchasePanel({
  orderId,
  lines,
  initial,
  given,
  currency,
  returnNote,
}: {
  orderId: string;
  lines: PurchaseLine[];
  initial: PurchaseDraft[];
  given: number | null;
  currency: Currency;
  returnNote: string | null;
}) {
  const [drafts, setDrafts] = useState(initial);
  const [confirm, setConfirm] = useState(false);
  const [message, setMessage] = useState<{ tone: "danger" | "success"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const patch = (id: string, p: Partial<PurchaseDraft>) => setDrafts((ds) => ds.map((d) => (d.lineId === id ? { ...d, ...p } : d)));
  const cmp = draftsComparison(given, drafts);
  const run = (submit: boolean) =>
    start(async () => {
      const r = await purchaseAction({ orderId, lines: toPurchaseLines(drafts) }, submit);
      setConfirm(false);
      setMessage(r.error ? { tone: "danger", text: r.error } : { tone: "success", text: submit ? "Enviado a revisión." : "Compra guardada." });
    });
  return (
    <div className="stack">
      {returnNote && (
        <Alert variant="warning" title="Te lo devolvieron para corregir">
          {returnNote}
        </Alert>
      )}
      {message && <Alert variant={message.tone}>{message.text}</Alert>}
      <h2>Productos</h2>
      {lines.map((l) => {
        const d = drafts.find((x) => x.lineId === l.id) as PurchaseDraft;
        return (
          <Card key={l.id} className="stack">
            <h3>{l.name}</h3>
            <p className="muted">
              Pedido: {l.qty} {l.unit}
            </p>
            <SegmentedControl
              aria-label={`¿Compraste ${l.name}?`}
              value={d.bought === null ? "" : d.bought ? "yes" : "no"}
              onValueChange={(v) => patch(l.id, { bought: v === "yes" })}
              options={[
                { value: "yes", label: "Sí" },
                { value: "no", label: "No" },
              ]}
            />
            {d.bought === true && (
              <div className="row">
                <Field label={`Cantidad comprada (${l.unit})`} htmlFor={`q-${l.id}`}>
                  <Input id={`q-${l.id}`} type="number" inputMode="decimal" min={0} step="any" value={d.qty} onChange={(e) => patch(l.id, { qty: e.target.value })} />
                </Field>
                <Field label={`Costo unitario (${currency.code || "—"})`} htmlFor={`c-${l.id}`}>
                  <Input id={`c-${l.id}`} type="number" inputMode="decimal" min={0} step="any" value={d.cost} onChange={(e) => patch(l.id, { cost: e.target.value })} />
                </Field>
              </div>
            )}
            {d.bought === false && <p className="hint">No lo compraste. Quedará como faltante en la revisión.</p>}
            {d.bought === null && <p className="hint">{draftIssue(d)}</p>}
          </Card>
        );
      })}
      <Card className="stack" aria-labelledby="cmp-h">
        <h2 id="cmp-h">Entregado · Gastado · Sobrante</h2>
        {cmp.given === null ? (
          <p>
            Gastado: <MoneyValue value={cmp.spent} currency={currency} />
          </p>
        ) : (
          <SpendSummary delivered={cmp.given} spent={cmp.spent} currency={currency} products={spentByProduct(Object.fromEntries(lines.map((l) => [l.id, l.name])), drafts)} />
        )}
      </Card>
      <div className="row">
        <Button variant="secondary" loading={pending} onClick={() => run(false)}>
          Guardar
        </Button>
        <Button disabled={!purchaseReady(drafts)} loading={pending} onClick={() => setConfirm(true)}>
          Enviar a revisión
        </Button>
      </div>
      <AlertDialog open={confirm} onClose={() => setConfirm(false)} onConfirm={() => run(true)} confirmLabel="Enviar a revisión" cancelLabel="Seguir editando" loading={pending} tone="success" icon="Check" title="¿Enviar a revisión?">
        Quien revisa verificará lo que llega al almacén. Mientras tanto no podrás editar el pedido.
      </AlertDialog>
    </div>
  );
}
