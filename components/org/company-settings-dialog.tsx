"use client";

import { useState } from "react";
import { type ActionState, renameUnitAction, updateSettingsAction } from "@/app/(app)/companias/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";
import { Select } from "@/components/ui/select";

export function CompanySettingsButton({
  companyId,
  name,
  hours,
  timezone,
  label = "Ajustes",
  variant = "secondary",
  className,
  size,
  icon,
}: {
  companyId: string;
  name: string;
  hours: number;
  timezone: string;
  label?: string;
  variant?: "secondary" | "outline";
  className?: string;
  size?: "sm" | "md";
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [tz, setTz] = useState(timezone);
  const zones = Array.from(new Set(["UTC", timezone, ...Intl.supportedValuesOf("timeZone")])).map((z) => ({ value: z, label: z }));
  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        {label}
        {icon}
      </Button>
      {open && (
        <FormDialog<ActionState>
          title={`Ajustes de ${name}`}
          description="El cambio queda en el historial."
          action={async (_, formData) => {
            const renamed = await renameUnitAction("company", companyId, formData);
            return renamed.error ? renamed : updateSettingsAction(companyId, formData);
          }}
          successMessage="Guardado."
          onClose={() => setOpen(false)}
        >
          {(state) => (
            <>
            <Field label="Nombre" htmlFor="name">
              <Input id="name" name="name" required maxLength={80} defaultValue={name} />
            </Field>
            <Field label="Tope de sesión (horas)" htmlFor="hours" hint="Máximo 24 horas. Ningún rol puede superar este tope.">
              <Input
                id="hours"
                name="hours"
                type="number"
                inputMode="decimal"
                min={0.5}
                max={24}
                step={0.5}
                required
                defaultValue={hours}
                aria-describedby="hours-hint"
                aria-invalid={state.error ? true : undefined}
              />
            </Field>
            <Field label="Zona horaria" htmlFor="timezone" hint="Define «hoy» y los rangos de fechas de la compañía.">
              <Select id="timezone" name="timezone" options={zones} value={tz} onValueChange={(v) => setTz(v ?? timezone)} />
            </Field>
            </>
          )}
        </FormDialog>
      )}
    </>
  );
}
