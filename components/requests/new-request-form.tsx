"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { loadTransferConfigAction } from "@/app/(app)/existencias/transfer-actions";
import { type RequestActionState, createRequestAction } from "@/app/(app)/solicitudes/actions";
import { Button } from "@/components/ui/button";
import { buttonClass } from "@/components/ui/button-class";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { QuantityPicker } from "@/components/ui/quantity-picker";
import { Select, type SelectOption } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { baseLabel } from "@/components/stock/entry-logic";
import { usedProducts } from "./request-logic";

export type RequestProduct = SelectOption;
type Line = { key: number; productId: string; amount: string; unit: string; units: SelectOption[] };

export function NewRequestForm({
  products,
  initial,
  stores,
  storeId,
}: {
  products: RequestProduct[];
  initial: { productId: string; amount: string }[];
  stores?: SelectOption[];
  storeId?: string;
}) {
  const [state, action] = useActionState<RequestActionState, FormData>(createRequestAction, {});
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>(() => initial.map((l, i) => ({ key: i, productId: l.productId, amount: l.amount, unit: "base", units: [{ value: "base", label: "…" }] })));
  const [next, setNext] = useState(initial.length);

  const patch = (key: number, p: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...p } : l)));
  const loadUnits = (key: number, productId: string) =>
    loadTransferConfigAction(productId).then((c) => {
      if (!c) return patch(key, { units: [{ value: "base", label: "base" }] });
      patch(key, { units: [{ value: "base", label: baseLabel(c.baseUnit) }, ...c.units.map((u) => ({ value: u, label: u }))] });
    });

  useEffect(() => {
    initial.forEach((l, i) => void loadUnits(i, l.productId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const taken = usedProducts(lines);
  const valid = lines.length > 0 && lines.every((l) => l.productId && Number(l.amount.replace(",", ".")) > 0);

  return (
    <FormShell
      action={action}
      error={state.error}
      submitLabel="Enviar solicitud"
      pendingLabel="Enviando…"
      cancel={
        <Link className={buttonClass("outline", "md")} href="/solicitudes">
          Cancelar
        </Link>
      }
    >
      {stores && (
        <Field label="Tienda" htmlFor="request-store">
          <Select id="request-store" options={stores} value={storeId ?? ""} onValueChange={(v) => v && router.replace(`/solicitudes/nueva?tienda=${v}`)} />
        </Field>
      )}
      <input type="hidden" name="storeId" value={storeId ?? ""} />
      <input type="hidden" name="lines" value={JSON.stringify(lines.map((l) => ({ productId: l.productId, qty: l.amount, unit: l.unit })))} />
      {lines.map((l, i) => (
        <Card key={l.key}>
          <div className="stack">
            <Field label={`Producto ${i + 1}`} htmlFor={`request-product-${l.key}`}>
              <Select
                id={`request-product-${l.key}`}
                options={products.map((p) => ({ ...p, disabled: taken.has(p.value) && p.value !== l.productId }))}
                placeholder="Elige un producto"
                value={l.productId}
                onValueChange={(v) => {
                  patch(l.key, { productId: v ?? "", unit: "base" });
                  if (v) void loadUnits(l.key, v);
                }}
              />
            </Field>
            {l.productId && (
              <QuantityPicker
                id={`request-qty-${l.key}`}
                name={`qty-${l.key}`}
                unitName={`unit-${l.key}`}
                value={l.amount}
                unit={l.unit}
                units={l.units}
                onValueChange={(v) => patch(l.key, { amount: v })}
                onUnitChange={(u) => patch(l.key, { unit: u })}
              />
            )}
            <Button type="button" variant="outline" onClick={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}>
              Quitar
            </Button>
          </div>
        </Card>
      ))}
      <Button
        type="button"
        variant="secondary"
        onClick={() => {
          setLines((ls) => [...ls, { key: next, productId: "", amount: "", unit: "base", units: [{ value: "base", label: "base" }] }]);
          setNext(next + 1);
        }}
      >
        Añadir producto
      </Button>
      <Field label="Nota" htmlFor="request-note" optional>
        <Textarea id="request-note" name="note" maxLength={500} placeholder="Para el fin de semana." />
      </Field>
      {!valid && <p className="hint">Elige al menos un producto y su cantidad.</p>}
    </FormShell>
  );
}
