"use client";

import { useEffect, useState } from "react";
import { type EntryActionState, type EntryConfig, loadEntryConfigAction, registerEntryAction } from "@/app/(app)/existencias/entry-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Input } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { QuantityPicker } from "@/components/ui/quantity-picker";
import { Select } from "@/components/ui/select";
import { baseLabel, costPerBaseLabel, DEFAULT_BASE_UNIT, ENTRY_BASE_UNITS, type EntryProductOption, equivalentLabel, UNCONFIGURED_NOTICE } from "./entry-logic";

export type EntryProduct = EntryProductOption;
export type EntryCurrency = { id: string; code: string };

export function EntryDialog({
  kind,
  locationId,
  products,
  productId,
  costs,
  currencies,
  onClose,
}: {
  kind: "initial" | "direct";
  locationId: string;
  products: EntryProduct[];
  /** Fixed product (detail page); otherwise the user picks one. */
  productId?: string;
  costs: boolean;
  currencies: EntryCurrency[];
  onClose: () => void;
}) {
  const [product, setProduct] = useState(productId ?? "");
  const [loaded, setConfig] = useState<EntryConfig | null | undefined>(undefined);
  const [newBase, setNewBase] = useState(DEFAULT_BASE_UNIT);
  const unconfigured = !!products.find((p) => p.value === product)?.unconfigured;
  const config = unconfigured ? { baseUnit: newBase, presentations: [] } : loaded;
  const [unit, setUnit] = useState("base");
  const [amount, setAmount] = useState("");
  const [content, setContent] = useState("");
  const [cost, setCost] = useState("");
  const [unknownCost, setUnknownCost] = useState(false);
  const [currencyId, setCurrencyId] = useState(currencies[0]?.id ?? "");

  useEffect(() => {
    if (!product || unconfigured) return;
    let live = true;
    loadEntryConfigAction(product).then((c) => {
      if (!live) return;
      setConfig(c);
      setUnit("base");
      setContent("");
    });
    return () => {
      live = false;
    };
  }, [product, unconfigured]);

  const presentation = config?.presentations.find((p) => p.name === unit);
  const habitual = presentation?.content ?? 1;
  const factor = Number(content.replace(",", ".")) > 0 && presentation ? Number(content.replace(",", ".")) : habitual;
  const base = config?.baseUnit ?? "u";
  const units = [{ value: "base", label: baseLabel(base) }, ...(config?.presentations ?? []).map((p) => ({ value: p.name, label: p.name }))];
  const currency = currencies.find((c) => c.id === currencyId)?.code ?? "";
  const showCost = costs && !!config;
  const title = kind === "initial" ? "Entrada inicial" : "Entrada directa a tienda";

  return (
    <FormDialog<EntryActionState>
      title={title}
      description={kind === "direct" ? "Para lo que llega directo a la tienda, sin pasar por el almacén." : undefined}
      successMessage="Entrada registrada."
      action={(prev, f) => registerEntryAction(kind, locationId, prev, f)}
      onClose={onClose}
    >
      {() => (
        <>
          {productId ? (
            <input type="hidden" name="productId" value={productId} />
          ) : (
            <Field label="Producto" htmlFor="entry-product">
              <Select id="entry-product" name="productId" options={products} value={product} onValueChange={(v) => { setConfig(undefined); setProduct(v ?? ""); }} placeholder="Elige un producto" />
            </Field>
          )}
          {unconfigured && (
            <>
              <p className="hint">{UNCONFIGURED_NOTICE}</p>
              <Field label="Unidad base" htmlFor="entry-base-unit">
                <Select id="entry-base-unit" name="baseUnit" options={ENTRY_BASE_UNITS} value={newBase} onValueChange={(v) => { setNewBase(v ?? DEFAULT_BASE_UNIT); setUnit("base"); }} />
              </Field>
            </>
          )}
          {product && config === null && <p className="error-text">Este producto no maneja existencias.</p>}
          {config && (
            <>
              <Field label="Cantidad" htmlFor="entry-qty">
                <QuantityPicker id="entry-qty" name="qty" unitName="unit" value={amount} unit={unit} units={units} equivalent={equivalentLabel(amount, factor, base)} onValueChange={setAmount} onUnitChange={(u) => { setUnit(u); setContent(""); }} />
              </Field>
              {presentation && (
                <Field label={`Contenido real (${baseLabel(base)})`} htmlFor="entry-content" optional hint={Number(content.replace(",", ".")) > 0 && factor !== habitual ? `Difiere del habitual (${habitual} ${baseLabel(base)}). Se guardará solo en este lote.` : `Habitual: ${habitual} ${baseLabel(base)}`}>
                  <Input id="entry-content" name="content" type="number" inputMode="decimal" min={0} step="any" value={content} onChange={(e) => setContent(e.target.value)} />
                </Field>
              )}
              {showCost && (
                <>
                  <Field label={unit === "base" ? `Costo por ${baseLabel(base)}` : "Costo por presentación"} htmlFor="entry-cost" optional hint={!unknownCost ? costPerBaseLabel(cost, factor, base, currency) || undefined : undefined}>
                    <Input id="entry-cost" name="cost" type="number" inputMode="decimal" min={0} step="any" value={cost} disabled={unknownCost} onChange={(e) => setCost(e.target.value)} />
                  </Field>
                  {currencies.length > 0 && (
                    <Field label="Divisa" htmlFor="entry-currency">
                      <Select id="entry-currency" name="currencyId" options={currencies.map((c) => ({ value: c.id, label: c.code }))} value={currencyId} onValueChange={(v) => setCurrencyId(v ?? "")} />
                    </Field>
                  )}
                  <Checkbox name="unknownCost" label="No conozco el costo" description="Se marcará como «Sin costo conocido»." checked={unknownCost} onCheckedChange={(c) => setUnknownCost(c)} />
                </>
              )}
            </>
          )}
        </>
      )}
    </FormDialog>
  );
}
