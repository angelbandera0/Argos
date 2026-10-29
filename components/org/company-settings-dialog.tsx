"use client";

import { useState } from "react";
import { type ActionState, updateSettingsAction } from "@/app/(app)/companias/actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";

export function CompanySettingsButton({
  companyId,
  name,
  hours,
  label = "Ajustes",
  variant = "secondary",
  className,
}: {
  companyId: string;
  name: string;
  hours: number;
  label?: string;
  variant?: "secondary" | "outline";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} className={className} onClick={() => setOpen(true)}>
        {label}
      </Button>
      {open && (
        <FormDialog<ActionState>
          title={`Ajustes de ${name}`}
          description="El cambio queda en el historial."
          action={(_, formData) => updateSettingsAction(companyId, formData)}
          successMessage="Guardado."
          onClose={() => setOpen(false)}
        >
          {(state) => (
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
          )}
        </FormDialog>
      )}
    </>
  );
}
