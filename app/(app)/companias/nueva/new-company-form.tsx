"use client";

import { useActionState } from "react";
import { AlertCircle } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { type ActionState, createCompanyAction } from "../actions";

export function NewCompanyForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createCompanyAction, {});
  return (
    <Card>
      <form className="auth-form" action={action}>
        <Field label="Nombre de la compañía" htmlFor="name" hint="Le asignaremos un código de 4 caracteres que no cambia.">
          <Input
            id="name"
            name="name"
            required
            maxLength={80}
            autoComplete="off"
            defaultValue={state.name}
            aria-describedby="name-hint"
            aria-invalid={state.error ? true : undefined}
          />
        </Field>
        {state.error && (
          <p className="form-error" role="alert">
            <AlertCircle aria-hidden="true" />
            {state.error}
          </p>
        )}
        <Button type="submit" loading={pending}>
          {pending ? "Creando…" : "Crear compañía"}
        </Button>
      </form>
    </Card>
  );
}
