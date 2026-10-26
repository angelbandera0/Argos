"use client";

import { useState } from "react";
import { Field, Input } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { useToast } from "@/components/ui/toast";
import { updateSettingsAction } from "../../actions";

export function SettingsForm({ companyId, hours }: { companyId: string; hours: number }) {
  const toast = useToast();
  const [error, setError] = useState<string>();

  async function submit(formData: FormData) {
    const r = await updateSettingsAction(companyId, formData);
    setError(r.error);
    if (!r.error) toast.success("Guardado.", { description: "El cambio queda en el historial." });
  }

  return (
    <FormShell action={submit} error={error}>
      <Field
        label="Tope de sesión (horas)"
        htmlFor="hours"
        hint="Máximo 24 horas. Ningún rol puede superar este tope."
      >
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
          aria-invalid={error ? true : undefined}
        />
      </Field>
    </FormShell>
  );
}
