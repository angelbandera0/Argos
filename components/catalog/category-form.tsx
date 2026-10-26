"use client";

import { useActionState, useEffect, useRef } from "react";
import { type CatalogActionState, createCategoryAction } from "@/app/(app)/catalogo/actions";
import { AlertCircle, Plus } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function CategoryForm() {
  const [state, action, pending] = useActionState<CatalogActionState, FormData>(createCategoryAction, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!pending && !state.error && !state.nameError) ref.current?.reset();
  }, [pending, state]);

  return (
    <form ref={ref} className="stack" action={action}>
      <Field label="Nueva categoría" htmlFor="name" error={state.nameError}>
        <Input
          id="name"
          name="name"
          required
          maxLength={80}
          autoComplete="off"
          aria-describedby={state.nameError ? "name-error" : undefined}
          aria-invalid={state.nameError ? true : undefined}
        />
      </Field>
      {state.error && (
        <p className="form-error" role="alert">
          <AlertCircle aria-hidden="true" />
          {state.error}
        </p>
      )}
      <div className="form-actions">
        <Button type="submit" loading={pending}>
          <Plus aria-hidden="true" />
          {pending ? "Agregando…" : "Agregar categoría"}
        </Button>
      </div>
    </form>
  );
}
