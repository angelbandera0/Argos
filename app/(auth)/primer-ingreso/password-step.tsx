"use client";

import { useActionState, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { completeFirstLogin, type FormState } from "../actions";

const MIN = 12;

export function PasswordStep() {
  const [state, action, pending] = useActionState<FormState, FormData>(completeFirstLogin, {});
  const [length, setLength] = useState(0);
  const enough = length >= MIN;
  return (
    <form className="auth-form" action={action}>
      <Field
        label="Contraseña nueva"
        htmlFor="password"
        hint={enough ? "Longitud suficiente." : `${length} de ${MIN} caracteres como mínimo.`}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN}
          autoFocus
          aria-describedby="password-hint"
          onChange={(e) => setLength(e.target.value.length)}
        />
        <div
          className="meter"
          role="progressbar"
          aria-label="Longitud de la contraseña"
          aria-valuemin={0}
          aria-valuemax={MIN}
          aria-valuenow={Math.min(length, MIN)}
        >
          <span style={{ width: `${(Math.min(length, MIN) / MIN) * 100}%` }} />
        </div>
      </Field>
      <Field label="Repite la contraseña" htmlFor="confirm">
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={MIN} />
      </Field>
      {state.error && <Alert variant="danger">{state.error}</Alert>}
      <Button type="submit" loading={pending} disabled={!enough}>
        {pending ? "Guardando…" : "Guardar y continuar"}
      </Button>
    </form>
  );
}
