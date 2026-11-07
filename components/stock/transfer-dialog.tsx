"use client";

import { useEffect, useState } from "react";
import {
  type TransferActionState,
  type TransferConfig,
  type TransferPreview,
  loadTransferConfigAction,
  previewTransferAction,
  transferStockAction,
} from "@/app/(app)/existencias/transfer-actions";
import { Alert } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
import { Field, Input } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { QuantityPicker } from "@/components/ui/quantity-picker";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Unit } from "@/core/domain/stock";
import { baseLabel } from "./entry-logic";
import { formatStockQty } from "./stock-list-logic";
import { type PreviewLot, pendingBase, picksFrom, suggestedValues } from "./transfer-logic";

export type TransferOption = { value: string; label: string };
export type TransferCurrency = { id: string; code: string };

const money = (c: PreviewLot["unitCost"], currencies: TransferCurrency[]) =>
  c === undefined ? null : c === null ? "Sin costo conocido" : `${new Intl.NumberFormat("es", { maximumFractionDigits: 4 }).format(c.amount)} ${currencies.find((x) => x.id === c.currencyId)?.code ?? ""}`;

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
  /** Fixed product (detail page); otherwise the user picks one. */
  productId?: string;
  canChooseLot: boolean;
  currencies: TransferCurrency[];
  onClose: () => void;
}) {
  const [product, setProduct] = useState(productId ?? "");
  const [config, setConfig] = useState<TransferConfig | null | undefined>(undefined);
  const [store, setStore] = useState(stores.length === 1 ? stores[0].value : "");
  const [unit, setUnit] = useState("base");
  const [amount, setAmount] = useState("");
  const [choose, setChoose] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<TransferPreview | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!product) return;
    let live = true;
    loadTransferConfigAction(product).then((c) => {
      if (!live) return;
      setConfig(c);
      setUnit("base");
      setValues({});
      setChoose(false);
    });
    return () => {
      live = false;
    };
  }, [product]);

  const picks = choose ? picksFrom(values) : [];
  const picksKey = JSON.stringify(picks);
  useEffect(() => {
    const n = Number(amount.replace(",", "."));
    if (!product || !config || !(n > 0)) return;
    let live = true;
    previewTransferAction({ productId: product, fromLocationId, qty: n, unit, picks: picksKey === "[]" ? undefined : JSON.parse(picksKey) }).then((p) => live && setPreview(p));
    return () => {
      live = false;
    };
  }, [product, config, fromLocationId, amount, unit, picksKey]);

  const base = config?.baseUnit ?? "u";
  const units = [{ value: "base", label: baseLabel(base) }, ...(config?.units ?? []).map((u) => ({ value: u, label: u }))];
  const valid = Number(amount.replace(",", ".")) > 0;
  const shown = valid ? preview : null;
  const pending = shown && choose ? pendingBase(picks, shown.baseQty) : 0;
  const suggested = new Set(shown?.suggested.map((s) => s.lotId));
  const fmt = (n: number) => formatStockQty(n, base as Unit);

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
          {productId ? (
            <input type="hidden" name="productId" value={productId} />
          ) : (
            <Field label="Producto" htmlFor="transfer-product">
              <Select id="transfer-product" name="productId" options={products} value={product} onValueChange={(v) => { setConfig(undefined); setPreview(null); setProduct(v ?? ""); }} placeholder="Elige un producto" />
            </Field>
          )}
          {product && config === null && <p className="error-text">Este producto no maneja existencias.</p>}
          {config && (
            <>
              <Field label="Cantidad" htmlFor="transfer-qty" hint="La cantidad va en la unidad de movimiento de la tienda.">
                <QuantityPicker id="transfer-qty" name="qty" unitName="unit" value={amount} unit={unit} units={units} onValueChange={setAmount} onUnitChange={setUnit} />
              </Field>
              {shown?.error && <Alert variant="danger" compact>{shown.error}</Alert>}
              {shown && !shown.error && (
                <>
                  <p className="hint">Equivale a {fmt(shown.baseQty)}. {choose ? "Lotes elegidos" : "Sale de los lotes más antiguos primero (FIFO)"}:</p>
                  <ul className="stack">
                    {shown.lots.map((l) => {
                      const used = shown.allocation.find((a) => a.lotId === l.id)?.qty ?? 0;
                      const cost = money(l.unitCost, currencies);
                      return (
                        <li key={l.id} className="row">
                          <span className="mono">{l.id.slice(0, 8)}</span>
                          <LocalDateTime value={l.receivedAt} />
                          <span>Disponible {fmt(l.remaining)}</span>
                          {cost && <span>Costo {cost}</span>}
                          {suggested.has(l.id) && <Chip>Sugerido</Chip>}
                          {choose ? (
                            <Input aria-label={`Cantidad del lote ${l.id.slice(0, 8)}`} type="number" inputMode="decimal" min={0} step="any" value={values[l.id] ?? ""} onChange={(e) => setValues({ ...values, [l.id]: e.target.value })} />
                          ) : (
                            used > 0 && <strong>{fmt(used)}</strong>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  {choose && pending !== 0 && <p className="hint">{pending > 0 ? `Faltan ${fmt(pending)} por asignar.` : `Te pasas por ${fmt(-pending)}.`}</p>}
                  {shown.isDeviation && (
                    <>
                      <Alert variant="warning" compact>No sale del lote más antiguo.</Alert>
                      <Field label="Motivo" htmlFor="transfer-reason" optional>
                        <Textarea id="transfer-reason" name="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
                      </Field>
                    </>
                  )}
                  {canChooseLot ? (
                    <Checkbox
                      label="Elegir lotes"
                      description="Por defecto sale el lote más antiguo."
                      checked={choose}
                      onCheckedChange={(c) => { setChoose(c); setValues(c ? suggestedValues(shown.suggested) : {}); }}
                    />
                  ) : (
                    <p className="hint">Solo puedes trasladar siguiendo el lote más antiguo.</p>
                  )}
                </>
              )}
              <input type="hidden" name="picks" value={choose ? picksKey : ""} />
            </>
          )}
        </>
      )}
    </FormDialog>
  );
}
