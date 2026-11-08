"use client";

import { useEffect, useState } from "react";
import {
  type TransferActionState,
  type TransferConfig,
  type TransferPreview,
  loadTransferConfigAction,
  transferStockAction,
} from "@/app/(app)/existencias/transfer-actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { QuantityPicker } from "@/components/ui/quantity-picker";
import { Select } from "@/components/ui/select";
import { baseLabel } from "./entry-logic";
import { type LotChoice, type LotCurrency, LotPicker, lotMoney } from "./lot-picker";
import { allocationValue, moveEquivalent } from "./transfer-logic";

export type TransferOption = { value: string; label: string };
export type TransferCurrency = LotCurrency;

type Line = { key: number; product: string; config: TransferConfig | null | undefined; unit: string; amount: string; choice: LotChoice; preview: TransferPreview | null };

const newLine = (product: string, key: number): Line => ({ key, product, config: undefined, unit: "base", amount: "", choice: { picks: [], reason: "" }, preview: null });

function LineFields({ line, index, fixed, products, fromLocationId, canChooseLot, currencies, onPatch, onRemove }: {
  line: Line;
  index: number;
  fixed: boolean;
  products: TransferOption[];
  fromLocationId: string;
  canChooseLot: boolean;
  currencies: LotCurrency[];
  onPatch: (p: Partial<Line>) => void;
  onRemove?: () => void;
}) {
  const { product, config } = line;
  useEffect(() => {
    if (!product) return;
    let live = true;
    loadTransferConfigAction(product).then((c) => live && onPatch({ config: c }));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const base = config?.baseUnit ?? "u";
  const units = config?.options ?? [{ value: "base", label: baseLabel(base), factor: 1 }];
  const id = `transfer-${line.key}`;
  return (
    <div className="stack">
      {!fixed && (
        <Field label={`Producto ${index + 1}`} htmlFor={`${id}-product`}>
          <Select id={`${id}-product`} options={products} value={product} onValueChange={(v) => onPatch({ product: v ?? "", config: undefined, preview: null, unit: "base", choice: { picks: [], reason: "" } })} placeholder="Elige un producto" />
        </Field>
      )}
      {product && config === null && <p className="error-text">Este producto no maneja existencias.</p>}
      {config && (
        <>
          <Field label="Cantidad" htmlFor={`${id}-qty`} hint="Mueve por presentación, por unidad de medida o por unidad de movimiento.">
            <QuantityPicker id={`${id}-qty`} name={`qty-${line.key}`} unitName={`unit-${line.key}`} value={line.amount} unit={line.unit} units={units} equivalent={moveEquivalent(units, line.unit, line.amount, base)} onValueChange={(amount) => onPatch({ amount })} onUnitChange={(unit) => onPatch({ unit })} />
          </Field>
          <LotPicker
            key={product}
            id={id}
            productId={product}
            locationId={fromLocationId}
            amount={line.amount}
            unit={line.unit}
            baseUnit={base}
            canChooseLot={canChooseLot}
            currencies={currencies}
            onChange={(choice) => onPatch({ choice })}
            onPreview={(preview) => onPatch({ preview })}
          />
        </>
      )}
      {onRemove && <Button variant="secondary" size="sm" onClick={onRemove}>Quitar producto</Button>}
    </div>
  );
}

export function TransferDialog({
  fromLocationId,
  stores,
  products,
  productId,
  canChooseLot,
  currencies,
  onClose,
}: {
  fromLocationId: string;
  stores: TransferOption[];
  products: TransferOption[];
  /** Fixed product (detail page); otherwise the user adds as many products as needed. */
  productId?: string;
  canChooseLot: boolean;
  currencies: TransferCurrency[];
  onClose: () => void;
}) {
  const [store, setStore] = useState(stores.length === 1 ? stores[0].value : "");
  const [lines, setLines] = useState<Line[]>([newLine(productId ?? "", 0)]);
  const patch = (key: number, p: Partial<Line>) => setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...p } : l)));

  const payload = JSON.stringify(
    lines.map((l) => ({
      productId: l.product,
      qty: Number(l.amount.replace(",", ".")),
      unit: l.unit,
      picks: l.choice.picks.length ? l.choice.picks : undefined,
      reason: l.choice.reason || undefined,
    })),
  );

  const totals = new Map<string, number>();
  let valued = false;
  let unknown = false;
  for (const l of lines) {
    const v = l.preview && !l.preview.error && Number(l.amount.replace(",", ".")) > 0 ? allocationValue(l.preview.lots, l.preview.allocation) : null;
    if (!v) continue;
    valued = true;
    unknown ||= v.unknown;
    for (const c of v.byCurrency) totals.set(c.currencyId, (totals.get(c.currencyId) ?? 0) + c.amount);
  }

  return (
    <FormDialog<TransferActionState>
      title="Trasladar a tienda"
      description="Sale del almacén general y entra en la tienda."
      successMessage="Traslado registrado."
      size="lg"
      action={(prev, f) => transferStockAction(fromLocationId, prev, f)}
      onClose={onClose}
    >
      {() => (
        <>
          <Field label="Tienda destino" htmlFor="transfer-store">
            <Select id="transfer-store" name="toLocationId" options={stores} value={store} onValueChange={(v) => setStore(v ?? "")} placeholder="Elige una tienda" />
          </Field>
          {lines.map((l, i) => (
            <LineFields
              key={l.key}
              line={l}
              index={i}
              fixed={!!productId}
              products={products}
              fromLocationId={fromLocationId}
              canChooseLot={canChooseLot}
              currencies={currencies}
              onPatch={(p) => patch(l.key, p)}
              onRemove={!productId && lines.length > 1 ? () => setLines((ls) => ls.filter((x) => x.key !== l.key)) : undefined}
            />
          ))}
          {!productId && <Button variant="secondary" size="sm" onClick={() => setLines((ls) => [...ls, newLine("", Math.max(...ls.map((x) => x.key)) + 1)])}>Añadir producto</Button>}
          {valued && (
            <p className="hint">
              Valor trasladado: {totals.size === 0 ? "Sin costo conocido" : [...totals].map(([c, a]) => lotMoney({ amount: a, currencyId: c }, currencies)).join(" + ")}
              {unknown && totals.size > 0 ? " (sin contar lotes sin costo conocido)" : ""}
            </p>
          )}
          <input type="hidden" name="lines" value={payload} />
        </>
      )}
    </FormDialog>
  );
}
