"use client";

import Link from "next/link";
import { useActionState } from "react";
import { buttonClass } from "@/components/ui/button-class";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { type ActionState, createCompanyAction } from "../actions";

export function NewCompanyForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createCompanyAction, {});
  return (
    <Card>
      <FormShell
        action={action}
        error={state.error}
        pending={pending}
        submitLabel="Crear compañía"
        pendingLabel="Creando…"
        cancel={
          <Link className={buttonClass("secondary", "md")} href="/companias">
            Cancelar
          </Link>
        }
      >
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
      </FormShell>
    </Card>
  );
}
