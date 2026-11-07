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
import { currencyErrors, moneyExamples } from "./currency-form-logic";

export interface CurrencyInitial {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  isDefault: boolean;
  active: boolean;
}

const { Coins } = NAV_ICONS;

const decimalOptions = (current: number) =>
  [...new Set([0, 2, 3, current])].sort().map((n) => ({ value: String(n), label: String(n) }));

export function CurrencyForm({ currencyId, initial }: { currencyId: string | null; initial: CurrencyInitial }) {
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
  const [touched, setTouched] = useState(false);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (!state.savedId) return;
    toast.success(currencyId ? "Divisa guardada" : "Divisa creada");
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

      <FormSection n={1} title="Datos de la divisa" description="Cambia cómo se escriben los montos y qué billetes y monedas existen.">
        <Field label="Código" htmlFor="code" hint="3 letras, ej. CUP." error={state.codeError ?? shown.code}>
          <Input
            id="code"
            name="code"
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
      </FormSection>

      <FormSection n={2} title="Uso" description="Cuál es la divisa de referencia y si está disponible.">
        <ToggleCard
          icon={<Coins />}
          title="Predeterminada"
          description="Se propone en pedidos y entradas."
          checked={isDefault}
          onCheckedChange={(v) => {
            setIsDefault(v);
            if (v) setActive(true);
          }}
        />
        <ToggleCard
          icon={<Coins />}
          title="Activa"
          description={
            isDefault
              ? "Una divisa predeterminada no se puede desactivar. Elige antes otra predeterminada."
              : "Inactiva no se ofrece en pedidos nuevos."
          }
          checked={active}
          disabled={isDefault}
          locked={isDefault}
          onCheckedChange={setActive}
        />
      </FormSection>
    </FormShell>
  );
}
