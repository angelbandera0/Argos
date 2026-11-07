"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { createCurrencyAction, type CurrencyActionState, updateCurrencyAction } from "@/app/(app)/divisas/actions";
import { NAV_ICONS } from "@/components/icons";
import { buttonClass } from "@/components/ui/button-class";
import { Field, Input } from "@/components/ui/field";
import { FormSection } from "@/components/ui/form-section";
import { FormShell, FormSubmit } from "@/components/ui/form-shell";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { SummaryCard, SummaryPanel } from "@/components/ui/summary-panel";
import { ToggleCard } from "@/components/ui/toggle-card";
import { useToast } from "@/components/ui/toast";
import type { Denomination } from "@/core/application/ports/currency-repository";
import { applyDefault, currencyErrors, decimalOptions, moneyExamples, serializeDenominations } from "./currency-form-logic";
import { DenominationManager } from "./denomination-manager";

export interface CurrencyInitial {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  isDefault: boolean;
  active: boolean;
}

const { Lock } = NAV_ICONS;

export function CurrencyForm({
  currencyId,
  initial,
  denominations = [],
}: {
  currencyId: string | null;
  initial: CurrencyInitial;
  denominations?: Denomination[];
}) {
  const [state, action, pending] = useActionState<CurrencyActionState, FormData>(
    currencyId ? updateCurrencyAction.bind(null, currencyId) : createCurrencyAction,
    {},
  );
  const [code, setCode] = useState(initial.code);
  const [name, setName] = useState(initial.name);
  const [symbol, setSymbol] = useState(initial.symbol);
  const [decimals, setDecimals] = useState(String(initial.decimals));
  const [isDefault, setIsDefault] = useState(initial.isDefault);
  const [active, setActive] = useState(initial.active);
  const [drafts, setDrafts] = useState<Denomination[]>([]);
  const [touched, setTouched] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!state.savedId) return;
    if (state.warning) toast.error(state.warning);
    else toast.success(currencyId ? "Divisa guardada" : "Divisa creada");
    if (!currencyId) router.push(`/divisas/${state.savedId}`);
  }, [state, currencyId, router, toast]);

  const errors = currencyErrors({ code, name, symbol, decimals });
  const shown = touched ? errors : {};
  const valid = Object.keys(errors).length === 0;

  return (
    <FormShell
      action={action}
      error={state.error}
      onSubmit={(e) => {
        if (!valid) {
          e.preventDefault();
          setTouched(true);
        }
      }}
      aside={
        <SummaryPanel
          icon="Coins"
          title={code.trim()}
          placeholder="Sin código"
          subtitle={name.trim() || undefined}
          actions={
            <>
              <FormSubmit label="Guardar divisa" size="lg" pending={pending} />
              <Link className={buttonClass("secondary", "lg")} href="/divisas">
                Cancelar
              </Link>
            </>
          }
        >
          <p className="eyebrow">Así se verán los montos</p>
          <SummaryCard rows={moneyExamples(code, decimals).map((x) => ({ label: x.label, value: <strong>{x.value}</strong> }))} />
          <p className="hint">Separador de miles «.» y decimal «,». En tablas, las cifras se alinean a la derecha.</p>
        </SummaryPanel>
      }
    >
      <input type="hidden" name="decimals" value={decimals} />
      <input type="hidden" name="isDefault" value={String(isDefault)} />
      <input type="hidden" name="active" value={String(active)} />

      <input type="hidden" name="denominations" value={serializeDenominations(currencyId ? [] : drafts)} />

      <FormSection n={1} title="Datos de la divisa">
        <div className="ui-form-section-cols">
          <Field label="Código" htmlFor="code" hint="3 letras, ej. CUP." error={state.codeError ?? shown.code}>
            <Input
              id="code"
              name="code"
              className="mono"
              maxLength={10}
              autoComplete="off"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onBlur={() => setTouched(true)}
              aria-invalid={state.codeError || shown.code ? true : undefined}
            />
          </Field>
          <Field label="Nombre" htmlFor="name" error={shown.name}>
            <Input
              id="name"
              name="name"
              maxLength={80}
              autoComplete="off"
              placeholder="Ej. Sol peruano"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={shown.name ? true : undefined}
            />
          </Field>
          <Field label="Símbolo" htmlFor="symbol" error={shown.symbol}>
            <Input
              id="symbol"
              name="symbol"
              maxLength={8}
              autoComplete="off"
              placeholder="Ej. S/"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              onBlur={() => setTouched(true)}
              aria-invalid={shown.symbol ? true : undefined}
            />
          </Field>
          <Field label="Decimales" htmlFor="decimals" error={shown.decimals}>
            <SegmentedControl id="decimals" aria-label="Decimales" options={decimalOptions(initial.decimals)} value={decimals} onValueChange={(v) => setDecimals(String(v))} />
          </Field>
        </div>
        <div className="ui-form-section-cols">
          <ToggleCard
            title="Predeterminada"
            description="Se propone en pedidos y entradas."
            checked={isDefault}
            onCheckedChange={(v) => {
              const next = applyDefault(v, active);
              setIsDefault(next.isDefault);
              setActive(next.active);
            }}
          />
          <ToggleCard
            title="Activa"
            description="Inactiva no se ofrece en pedidos nuevos."
            checked={active}
            disabled={isDefault}
            onCheckedChange={setActive}
          />
        </div>
        <p className="hint ui-form-section-note">
          <Lock aria-hidden="true" /> Una divisa predeterminada no se puede desactivar. Elige antes otra predeterminada.
        </p>
      </FormSection>

      <DenominationManager
        currencyId={currencyId}
        items={currencyId ? denominations : drafts}
        symbol={symbol}
        onItemsChange={setDrafts}
      />
    </FormShell>
  );
}
