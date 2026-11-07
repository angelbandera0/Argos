"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { createOrderAction, type OrderActionState } from "@/app/(app)/pedidos/actions";
import { Button } from "@/components/ui/button";
import { buttonClass } from "@/components/ui/button-class";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { FormShell, FormSubmit } from "@/components/ui/form-shell";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select, type SelectOption } from "@/components/ui/select";
import { StoreSplit } from "@/components/ui/store-split";
import { Checklist, SummaryCard, SummaryPanel } from "@/components/ui/summary-panel";
import { breakdownByStore, lineIssue, toWire, type DraftLine } from "./order-logic";

export function OrderBuilder({
  initial,
  stores,
  products,
  buyers,
}: {
  initial: DraftLine[];
  stores: { id: string; name: string }[];
  products: SelectOption[];
  buyers: SelectOption[];
}) {
  const [state, action, pending] = useActionState<OrderActionState, FormData>(createOrderAction, {});
  const [lines, setLines] = useState(initial);
  const [buyerId, setBuyerId] = useState("");
  const [productId, setProductId] = useState("");
  const patch = (key: string, p: Partial<DraftLine>) => setLines(lines.map((l) => (l.key === key ? { ...l, ...p } : l)));
  const add = () => {
    const p = products.find((o) => o.value === productId);
    if (!p) return;
    setLines([...lines, { key: `free-${Date.now()}`, productId: p.value, productName: p.label, unit: "", qty: 0, mode: "general", split: {} }]);
    setProductId("");
  };
  const issues = lines.map(lineIssue);
  const complete = lines.length > 0 && issues.every((i) => i === null);
  const { general, stores: perStore } = breakdownByStore(lines);
  const payload = JSON.stringify({ buyerId, lines: lines.map(toWire) });

  return (
    <FormShell
      action={action}
      error={state.error}
      aside={
        <SummaryPanel
          icon="ShoppingBag"
          title={lines.length ? `${lines.length} línea${lines.length === 1 ? "" : "s"}` : ""}
          placeholder="Sin líneas"
          actions={
            <>
              <FormSubmit label={buyerId ? "Crear y asignar" : "Crear pedido"} size="lg" pending={pending} disabled={!complete} />
              <Link className={buttonClass("secondary", "lg")} href="/pedidos">
                Cancelar
              </Link>
            </>
          }
        >
          <SummaryCard
            rows={[
              ...stores.filter((s) => perStore[s.id]).map((s) => ({ label: s.name, value: perStore[s.id] })),
              ...(general ? [{ label: "General (reparto al confirmar)", value: `${general} línea${general === 1 ? "" : "s"}` }] : []),
            ]}
          />
          <Checklist
            items={[
              { state: lines.length ? "ok" : "todo", label: "Al menos una línea" },
              { state: complete ? "ok" : "todo", label: "Cantidades y repartos completos" },
              { state: buyerId ? "ok" : "warn", label: "Comprador asignado" },
            ]}
          />
        </SummaryPanel>
      }
    >
      <input type="hidden" name="payload" value={payload} />
      <Card>
        <Field label="Comprador" htmlFor="buyer" optional hint="Solo quienes tienen el permiso de realizar compras.">
          <Select id="buyer" name="buyer" options={[{ value: "", label: "Sin asignar" }, ...buyers]} value={buyerId} onValueChange={(v) => setBuyerId(v ?? "")} />
        </Field>
      </Card>
      {lines.map((l, i) => (
        <Card key={l.key}>
          <div className="stack">
            <div className="row">
              <strong>{l.productName}</strong>
              <Button type="button" variant="ghost" size="sm" onClick={() => setLines(lines.filter((x) => x.key !== l.key))} aria-label={`Quitar ${l.productName}`}>
                Quitar
              </Button>
            </div>
            <Field label={`Cantidad${l.unit ? ` (${l.unit})` : ""}`} htmlFor={`qty-${l.key}`} error={issues[i] ?? undefined}>
              <Input id={`qty-${l.key}`} type="number" inputMode="decimal" min={0} step="any" value={l.qty || ""} onChange={(e) => patch(l.key, { qty: Number(e.target.value) })} />
            </Field>
            <SegmentedControl
              aria-label={`Destino de ${l.productName}`}
              value={l.mode}
              onValueChange={(v) => patch(l.key, { mode: v as DraftLine["mode"] })}
              options={[{ value: "general", label: "General" }, { value: "stores", label: "Por tienda" }]}
            />
            {l.mode === "stores" ? (
              <StoreSplit stores={stores} total={l.qty} values={l.split} onValuesChange={(split) => patch(l.key, { split })} />
            ) : (
              <p className="hint">El reparto por tiendas se exige al confirmar la recepción.</p>
            )}
          </div>
        </Card>
      ))}
      <Card>
        <Field label="Añadir producto" htmlFor="add-product">
          <div className="row">
            <Select id="add-product" options={products} value={productId} onValueChange={(v) => setProductId(v ?? "")} placeholder="Busca un producto" />
            <Button type="button" variant="secondary" onClick={add} disabled={!productId}>
              Añadir
            </Button>
          </div>
        </Field>
      </Card>
    </FormShell>
  );
}
