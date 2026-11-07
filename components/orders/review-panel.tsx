"use client";

import { useState, useTransition } from "react";
import { reviewAction } from "@/app/(app)/pedidos/[id]/actions";
import { Alert } from "@/components/ui/alert";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { MoneyValue } from "@/components/ui/money-value";
import type { Currency } from "@/components/ui/spend-logic";
import { StoreSplit, type SplitStore } from "@/components/ui/store-split";
import { Textarea } from "@/components/ui/textarea";
import type { OrderLine } from "@/core/application/ports/order-repository";
import { draftFromReview, missing, needsSplit, reviewIssue, reviewReady, shortageOf, surplus, toReviewLines, type ReviewDraft } from "./review-logic";

export function ReviewPanel({ orderId, lines, stores, currency, showCosts }: { orderId: string; lines: OrderLine[]; stores: SplitStore[]; currency: Currency; showCosts: boolean }) {
  const [drafts, setDrafts] = useState<ReviewDraft[]>(() => lines.map(draftFromReview));
  const [dialog, setDialog] = useState<"confirm" | "return" | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ tone: "danger" | "success"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const patch = (id: string, p: Partial<ReviewDraft>) => setDrafts((ds) => ds.map((d) => (d.lineId === id ? { ...d, ...p } : d)));
  const run = (payload: Record<string, unknown>, ok: string) =>
    start(async () => {
      const r = await reviewAction({ orderId, ...payload });
      setDialog(null);
      setMessage(r.error ? { tone: "danger", text: r.error } : { tone: "success", text: ok });
    });
  const revLines = () => toReviewLines(lines, drafts);
  const totalShortage = lines.reduce((s, l, i) => {
    const v = shortageOf(l.qtyBought, Number(drafts[i].received) || 0, l.unitCost);
    return v === null || s === null ? null : s + v;
  }, 0 as number | null);
  return (
    <div className="stack">
      {message && <Alert variant={message.tone}>{message.text}</Alert>}
      <h2>Lo que llegó</h2>
      {lines.map((l) => {
        const d = drafts.find((x) => x.lineId === l.id) as ReviewDraft;
        const received = Number(d.received) || 0;
        const issue = reviewIssue(l, d);
        return (
          <Card key={l.id} className="stack">
            <h3>{l.productName}</h3>
            <p className="muted">
              Pedido: {l.qty} {l.unit} · Comprado: {l.qtyBought ?? 0} {l.unit}
            </p>
            <Field label={`Recibido (${l.unit})`} htmlFor={`r-${l.id}`}>
              <Input id={`r-${l.id}`} type="number" inputMode="decimal" min={0} step="any" value={d.received} onChange={(e) => patch(l.id, { received: e.target.value })} />
            </Field>
            {needsSplit(l) && received > 0 && <StoreSplit stores={stores} total={received} values={d.split} onValuesChange={(split) => patch(l.id, { split })} />}
            <p className="hint">
              Faltante: {missing(l.qtyBought, received)} {l.unit}
              {showCosts && (
                <>
                  {" "}
                  (<MoneyValue value={shortageOf(l.qtyBought, received, l.unitCost) ?? null} currency={currency} />)
                </>
              )}
              {surplus(l.qtyBought, received) > 0 && ` · Sobrante guardado: ${surplus(l.qtyBought, received)} ${l.unit}`}
            </p>
            {issue && <p className="hint">{issue}</p>}
          </Card>
        );
      })}
      {showCosts && (
        <Card>
          <p>
            Faltante total valorado: <MoneyValue value={totalShortage} currency={currency} />
          </p>
        </Card>
      )}
      <div className="row">
        <Button variant="secondary" loading={pending} onClick={() => run({ kind: "save", lines: revLines() }, "Revisión guardada.")}>
          Guardar
        </Button>
        <Button disabled={!reviewReady(lines, drafts)} loading={pending} onClick={() => setDialog("confirm")}>
          Confirmar y sumar al stock
        </Button>
        <Button variant="secondary" loading={pending} onClick={() => setDialog("return")}>
          Devolver al comprador
        </Button>
      </div>
      <AlertDialog open={dialog === "confirm"} onClose={() => setDialog(null)} onConfirm={() => run({ kind: "confirm", lines: revLines() }, "Pedido confirmado: los lotes ya están en el stock.")} confirmLabel="Confirmar" loading={pending} tone="success" icon="Check" title="¿Confirmar el pedido?">
        Solo lo recibido entra al stock, con el costo reportado por el comprador.
      </AlertDialog>
      <AlertDialog open={dialog === "return"} onClose={() => setDialog(null)} onConfirm={() => run({ kind: "return", note }, "Pedido devuelto al comprador.")} confirmLabel="Devolver" loading={pending} tone="warning" icon="Check" title="Devolver al comprador">
        <Textarea aria-label="Nota para el comprador" placeholder="Ej. Llegó 1 saco de frijoles, no 2." maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
      </AlertDialog>
    </div>
  );
}
