"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Check } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { updateSettingsAction } from "../../actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Guardando…" : "Guardar"}
    </Button>
  );
}

export function SettingsForm({ companyId, hours }: { companyId: string; hours: number }) {
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);

  async function submit(formData: FormData) {
    setSaved(false);
    const r = await updateSettingsAction(companyId, formData);
    setError(r.error);
    setSaved(!r.error);
  }

  return (
    <form className="auth-form" action={submit}>
      <Field
        label="Tope de sesión (horas)"
        htmlFor="hours"
        hint="Máximo 24 horas. Ningún rol puede superar este tope."
        error={error}
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
      <Submit />
      {saved && (
        <p className="row" role="status">
          <Check aria-hidden="true" />
          Guardado. El cambio queda en el historial.
        </p>
      )}
    </form>
  );
}
