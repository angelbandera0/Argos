"use client";

import { useState } from "react";
import { type ActionState, createCompanyAction } from "@/app/(app)/companias/actions";
import { Plus } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";

export function NewCompanyButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        Nueva compañía
      </Button>
      {open && (
        <FormDialog<ActionState>
          title="Nueva compañía"
          description="Le asignaremos un código de 4 caracteres que no cambia."
          action={createCompanyAction}
          onClose={() => setOpen(false)}
        >
          {(state) => (
            <Field label="Nombre de la compañía" htmlFor="company-name">
              <Input
                id="company-name"
                name="name"
                required
                maxLength={80}
                autoComplete="off"
                defaultValue={state.name}
                aria-invalid={state.error ? true : undefined}
              />
            </Field>
          )}
        </FormDialog>
      )}
    </>
  );
}
