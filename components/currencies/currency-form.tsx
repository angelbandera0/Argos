"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { createCurrencyAction, type CurrencyActionState, updateCurrencyAction } from "@/app/(app)/divisas/actions";
import { NAV_ICONS } from "@/components/icons";
import { buttonClass } from "@/components/ui/button-class";
import { Chip } from "@/components/ui/chip";
import { Field, Input } from "@/components/ui/field";
import { FormSection } from "@/components/ui/form-section";
import { FormShell, FormSubmit } from "@/components/ui/form-shell";
import { Select } from "@/components/ui/select";
import { SummaryCard, SummaryPanel } from "@/components/ui/summary-panel";
import { Switch } from "@/components/ui/switch";
import { ToggleCard } from "@/components/ui/toggle-card";
import { useToast } from "@/components/ui/toast";
import { currencyErrors, previewAmount, SAMPLE_AMOUNT } from "./currency-form-logic";

export interface CurrencyInitial {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  isDefault: boolean;
  active: boolean;
}

const { Coins } = NAV_ICONS;

const DECIMAL_OPTIONS = [0, 1, 2, 3, 4].map((n) => ({ value: String(n), label: String(n) }));

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
          <SummaryCard
            rows={[
              { label: "Así se verá", value: <strong>{previewAmount(symbol, decimals)}</strong> },
              { label: "Decimales", value: decimals || "—" },
              {
                label: "Estado",
                value: (
                  <>
                    <Chip variant={active ? undefined : "ring"}>{active ? "Activa" : "Inactiva"}</Chip>
                    {isDefault && <Chip>Predeterminada</Chip>}
                  </>
                ),
              },
            ]}
          />
          <p className="hint">Ejemplo con {SAMPLE_AMOUNT.toLocaleString("es")}.</p>
        </SummaryPanel>
      }
    >
      <input type="hidden" name="decimals" value={decimals} />
      <input type="hidden" name="isDefault" value={String(isDefault)} />
      <input type="hidden" name="active" value={String(active)} />

      <FormSection n={1} title="Datos de la divisa" description="Cómo se identifica y se muestra en pedidos e importes.">
        <Field label="Código" htmlFor="code" hint="Ej. PEN, USD, EUR." error={state.codeError ?? shown.code}>
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
        <Field label="Decimales" htmlFor="decimals" hint="De 0 a 4." error={shown.decimals}>
          <Select id="decimals" options={DECIMAL_OPTIONS} value={decimals} onValueChange={(v) => setDecimals(v ?? "")} invalid={!!shown.decimals} />
        </Field>
      </FormSection>

      <FormSection n={2} title="Uso" description="Cuál es la divisa de referencia y si está disponible.">
        <ToggleCard
          icon={<Coins />}
          title="Predeterminada"
          description="Se propone al crear pedidos. Solo una divisa lo es a la vez."
          checked={isDefault}
          onCheckedChange={setIsDefault}
        />
        <Switch
          label="Activa"
          description="Las divisas inactivas no se ofrecen en pedidos nuevos."
          checked={active}
          onCheckedChange={setActive}
        />
      </FormSection>
    </FormShell>
  );
}
