"use client";

import { useEffect, useState } from "react";
import { type EntryActionState, type EntryConfig, loadEntryConfigAction, registerEntryAction } from "@/app/(app)/existencias/entry-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, Input } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { QuantityPicker } from "@/components/ui/quantity-picker";
import { Select } from "@/components/ui/select";
import { ALL_UNIT_OPTIONS, baseLabel, BULK, costPerPresentationLabel, DEFAULT_BASE_UNIT, type EntryProductOption, entryFactor, entrySummary, familyOptions, MOVEMENT_PREFIX, NEW_PRESENTATION, presentationOptions, quantityLabel, resolveBase } from "./entry-logic";

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
  const unconfigured = !!products.find((p) => p.value === product)?.unconfigured;
  const config = unconfigured ? { baseUnit: undefined, presentations: [], units: [], canConfigure: true } : loaded;
  const [presentation, setPresentation] = useState(BULK);
  const [amount, setAmount] = useState("");
  const [unitSel, setUnitSel] = useState<string | null>(null);
  const [contentSel, setContentSel] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [cost, setCost] = useState("");
  const [unknownCost, setUnknownCost] = useState(false);
  const [currencyId, setCurrencyId] = useState(currencies[0]?.id ?? "");

  useEffect(() => {
    if (!product || unconfigured) return;
    let live = true;
    loadEntryConfigAction(product).then((c) => {
      if (live) setConfig(c);
    });
    return () => {
      live = false;
    };
  }, [product, unconfigured]);

  const bulk = presentation === BULK;
  const isNew = presentation === NEW_PRESENTATION;
  const existing = config?.presentations.find((p) => p.name === presentation);
  const unit = unitSel ?? config?.baseUnit ?? DEFAULT_BASE_UNIT;
  const base = resolveBase(config?.baseUnit, unit);
  const contentQty = contentSel ?? (existing ? String(existing.content) : "");
  const contentUnit = contentSel === null && existing ? base : unit;
  const factor = entryFactor(bulk, contentSel === null && existing ? base : unit, contentQty, base);
  const name = isNew ? newName : presentation;
  const options = presentationOptions(config?.presentations ?? [], !!config?.canConfigure);
  const unitOptions = config?.baseUnit ? familyOptions(config.baseUnit, config.units ?? []) : ALL_UNIT_OPTIONS;
  const changePresentation = (v: string) => { setPresentation(v); setUnitSel(null); setContentSel(null); };
  const currency = currencies.find((c) => c.id === currencyId)?.code ?? "";
  const showCost = costs && !!config;
  const movement = bulk && unit.startsWith(MOVEMENT_PREFIX) ? config?.units.find((m) => MOVEMENT_PREFIX + m.name === unit) : undefined;
  const movedQty = Number(amount.replace(",", ".")) * (movement?.equivalence ?? 0);
  const summary = movement ? (movedQty > 0 ? `= ${new Intl.NumberFormat("es", { maximumFractionDigits: 3 }).format(movedQty)} ${baseLabel(base)}` : undefined) : entrySummary(bulk, amount, name, contentQty, contentUnit, base);
  const title = kind === "initial" ? "Entrada inicial" : "Entrada directa a tienda";

  return (
    <FormDialog<EntryActionState>
      title={title}
      submitLabel="Registrar" pendingLabel="Registrando…"
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
              <Select id="entry-product" name="productId" options={products} value={product} onValueChange={(v) => { setConfig(undefined); changePresentation(BULK); setProduct(v ?? ""); }} placeholder="Elige un producto" />
            </Field>
          )}
          {product && config === null && <p className="error-text">Este producto no maneja existencias.</p>}
          {config && (
            <>
              <Field label="Presentación" htmlFor="entry-presentation">
                <Select id="entry-presentation" name="unit" options={options} value={presentation} onValueChange={(v) => changePresentation(v ?? BULK)} />
              </Field>
              {isNew && (
                <Field label="Nombre de la presentación" htmlFor="entry-new-name" hint="Por ejemplo: saco, paca, caja.">
                  <Input id="entry-new-name" name="newName" required value={newName} onChange={(e) => setNewName(e.target.value)} />
                </Field>
              )}
              {bulk ? (
                <Field label="Cantidad" htmlFor="entry-qty">
                  <QuantityPicker id="entry-qty" name="qty" unitName="bulkUnit" value={amount} unit={unit} units={unitOptions} equivalent={summary} onValueChange={setAmount} onUnitChange={(u) => setUnitSel(u)} />
                </Field>
              ) : (
                <Field label={quantityLabel(presentation, name)} htmlFor="entry-qty">
                  <Input id="entry-qty" name="qty" type="number" inputMode="decimal" min={0} step="any" required value={amount} onChange={(e) => setAmount(e.target.value)} />
                </Field>
              )}
              {!bulk && (
                <Field label={`Contenido de cada ${name.trim() || "presentación"}`} htmlFor="entry-content" hint={existing && contentSel === null ? `Habitual: ${existing.content} ${baseLabel(base)}` : existing ? `Habitual: ${existing.content} ${baseLabel(config.baseUnit ?? base)}. Si difiere, se guarda solo en este lote.` : undefined}>
                  <div className="row">
                    <Input id="entry-content" name="contentQty" type="number" inputMode="decimal" min={0} step="any" required value={contentQty} onChange={(e) => setContentSel(e.target.value)} />
                    <Select name="contentUnit" aria-label="Unidad del contenido" options={unitOptions} value={contentUnit} onValueChange={(v) => { if (contentSel === null && existing) setContentSel(contentQty); setUnitSel(v ?? base); }} />
                  </div>
                </Field>
              )}
              {summary && !bulk && <p className="hint">{summary}</p>}
              {showCost && (
                <>
                  <Field label={`Costo por ${baseLabel(base)}`} htmlFor="entry-cost" optional hint={!unknownCost ? (bulk ? "" : costPerPresentationLabel(cost, factor, name, currency)) || undefined : undefined}>
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
