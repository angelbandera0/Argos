"use client";

import { useEffect, useState } from "react";
import { type OpActionState, type ReasonOption, adjustLotAction, loadReasonsAction, registerSurplusAction, writeOffAction } from "@/app/(app)/existencias/ops-actions";
import { loadTransferConfigAction, type TransferConfig } from "@/app/(app)/existencias/transfer-actions";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { QuantityPicker } from "@/components/ui/quantity-picker";
import { type LotChoice, type LotCurrency, LotPicker } from "./lot-picker";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Unit } from "@/core/domain/stock";
import { baseLabel } from "./entry-logic";
import { adjustBounds, adjustDeltaError } from "./ops-logic";
import { formatStockQty } from "./stock-list-logic";

type Option = { value: string; label: string };
type Currency = { id: string; code: string };

function useProductConfig(product: string) {
  const [config, setConfig] = useState<TransferConfig | null | undefined>(undefined);
  useEffect(() => {
    if (!product) return;
    let live = true;
    loadTransferConfigAction(product).then((c) => live && setConfig(c));
    return () => {
      live = false;
    };
  }, [product]);
  return [config, setConfig] as const;
}

function ProductField({ id, productId, products, value, onChange }: { id: string; productId?: string; products: Option[]; value: string; onChange: (v: string) => void }) {
  return productId ? (
    <input type="hidden" name="productId" value={productId} />
  ) : (
    <Field label="Producto" htmlFor={id}>
      <Select id={id} name="productId" options={products} value={value} onValueChange={(v) => onChange(v ?? "")} placeholder="Elige un producto" />
    </Field>
  );
}

export function WriteOffDialog({ locationId, products, productId, canChooseLot, currencies, onClose }: { locationId: string; products: Option[]; productId?: string; canChooseLot: boolean; currencies: LotCurrency[]; onClose: () => void }) {
  const [product, setProduct] = useState(productId ?? "");
  const [config, setConfig] = useProductConfig(product);
  const [reasons, setReasons] = useState<ReasonOption[] | undefined>(undefined);
  const [reasonId, setReasonId] = useState("");
  const [unit, setUnit] = useState("base");
  const [amount, setAmount] = useState("");
  const [choice, setChoice] = useState<LotChoice>({ picks: [], reason: "" });
  useEffect(() => {
    let live = true;
    loadReasonsAction().then((r) => live && setReasons(r));
    return () => {
      live = false;
    };
  }, []);
  const reason = reasons?.find((r) => r.id === reasonId);
  const units = [{ value: "base", label: baseLabel(config?.baseUnit ?? "u") }, ...(config?.units ?? []).map((u) => ({ value: u, label: u }))];

  return (
    <FormDialog<OpActionState>
      title="Dar de baja"
      description="Descuenta existencia por pérdida, daño u otro motivo; por defecto sale de los lotes más antiguos primero."
      successMessage="Baja registrada."
      size="md"
      action={(prev, f) => writeOffAction(locationId, prev, f)}
      onClose={onClose}
    >
      {(state) => (
        <>
          <ProductField id="wo-product" productId={productId} products={products} value={product} onChange={(v) => { setConfig(undefined); setProduct(v); setChoice({ picks: [], reason: "" }); }} />
          {product && config === null && <p className="error-text">Este producto no maneja existencias.</p>}
          {config && (
            <>
              <Field label="Cantidad" htmlFor="wo-qty">
                <QuantityPicker id="wo-qty" name="qty" unitName="unit" value={amount} unit={unit} units={units} onValueChange={setAmount} onUnitChange={setUnit} />
              </Field>
              <LotPicker key={product} id="wo" productId={product} locationId={locationId} amount={amount} unit={unit} baseUnit={config.baseUnit} canChooseLot={canChooseLot} currencies={currencies} onChange={setChoice} />
              <input type="hidden" name="picks" value={choice.picks.length ? JSON.stringify(choice.picks) : ""} />
              <input type="hidden" name="deviation" value={choice.reason} />
            </>
          )}
          <Field label="Motivo" htmlFor="wo-reason">
            <Select id="wo-reason" name="reasonId" options={(reasons ?? []).map((r) => ({ value: r.id, label: r.name }))} value={reasonId} onValueChange={(v) => setReasonId(v ?? "")} placeholder="Elige un motivo" />
          </Field>
          {reasons?.length === 0 && <p className="hint">No hay motivos activos. Pide a un administrador que los configure.</p>}
          <input type="hidden" name="requiresText" value={reason?.requiresText ? "true" : "false"} />
          {reason && (
            <Field label="Descripción" htmlFor="wo-text" optional={!reason.requiresText}>
              <Textarea id="wo-text" name="text" maxLength={300} required={reason.requiresText} />
            </Field>
          )}
          {state.error && <Alert variant="danger" compact>{state.error}</Alert>}
        </>
      )}
    </FormDialog>
  );
}

export function SurplusDialog({ locationId, products, productId, costs, currencies, onClose }: { locationId: string; products: Option[]; productId?: string; costs: boolean; currencies: Currency[]; onClose: () => void }) {
  const [product, setProduct] = useState(productId ?? "");
  const [config, setConfig] = useProductConfig(product);
  const [currency, setCurrency] = useState(currencies[0]?.id ?? "");
  const base = config?.baseUnit ?? "u";
  return (
    <FormDialog<OpActionState>
      title="Registrar sobrante"
      description="Suma existencia que aparece sin una entrada, como un lote nuevo."
      successMessage="Sobrante registrado."
      size="md"
      action={(prev, f) => registerSurplusAction(locationId, prev, f)}
      onClose={onClose}
    >
      {(state) => (
        <>
          <ProductField id="sp-product" productId={productId} products={products} value={product} onChange={(v) => { setConfig(undefined); setProduct(v); }} />
          {product && config === null && <p className="error-text">Este producto no maneja existencias.</p>}
          {config && (
            <Field label={`Cantidad (${base === "l" ? "L" : base})`} htmlFor="sp-qty">
              <Input id="sp-qty" name="qty" type="number" inputMode="decimal" min={0} step="any" required />
            </Field>
          )}
          {config && costs && (
            <>
              <Field label="Costo unitario" htmlFor="sp-cost" optional>
                <Input id="sp-cost" name="unitCost" type="number" inputMode="decimal" min={0} step="any" />
              </Field>
              <Field label="Divisa" htmlFor="sp-currency">
                <Select id="sp-currency" name="currencyId" options={currencies.map((c) => ({ value: c.id, label: c.code }))} value={currency} onValueChange={(v) => setCurrency(v ?? "")} />
              </Field>
            </>
          )}
          <Field label="Motivo" htmlFor="sp-text">
            <Textarea id="sp-text" name="text" maxLength={300} required />
          </Field>
          {state.error && <Alert variant="danger" compact>{state.error}</Alert>}
        </>
      )}
    </FormDialog>
  );
}

export function AdjustLotDialog({ lot, unit, onClose }: { lot: { id: string; initialQty: number; remaining: number }; unit: Unit; onClose: () => void }) {
  const [delta, setDelta] = useState("");
  const n = Number(delta.replace(",", "."));
  const error = delta.trim() ? adjustDeltaError(n, lot.initialQty, lot.remaining) : null;
  const { maxRestore } = adjustBounds(lot.initialQty, lot.remaining);
  return (
    <FormDialog<OpActionState>
      title="Ajustar lote"
      description={`Lote ${lot.id.slice(0, 8)} · actual ${formatStockQty(lot.remaining, unit)} de ${formatStockQty(lot.initialQty, unit)}.`}
      successMessage="Ajuste registrado."
      size="md"
      action={adjustLotAction}
      onClose={onClose}
    >
      {(state) => (
        <>
          <input type="hidden" name="lotId" value={lot.id} />
          <Field label="Cambio" htmlFor="adj-delta" error={error ?? undefined} hint={`Positivo restituye (hasta ${formatStockQty(maxRestore, unit)}); negativo descuenta.`}>
            <Input id="adj-delta" name="delta" type="number" inputMode="decimal" step="any" required value={delta} onChange={(e) => setDelta(e.target.value)} aria-invalid={error ? true : undefined} />
          </Field>
          <Field label="Motivo" htmlFor="adj-text">
            <Textarea id="adj-text" name="text" maxLength={300} required />
          </Field>
          {state.error && <Alert variant="danger" compact>{state.error}</Alert>}
        </>
      )}
    </FormDialog>
  );
}

export function WriteOffButton(props: Omit<React.ComponentProps<typeof WriteOffDialog>, "onClose">) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Dar de baja</Button>
      {open && <WriteOffDialog {...props} onClose={() => setOpen(false)} />}
    </>
  );
}

export function SurplusButton(props: Omit<React.ComponentProps<typeof SurplusDialog>, "onClose">) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Registrar sobrante</Button>
      {open && <SurplusDialog {...props} onClose={() => setOpen(false)} />}
    </>
  );
}
