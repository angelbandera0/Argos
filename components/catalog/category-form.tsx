"use client";

import { useActionState, useEffect, useRef } from "react";
import { type CatalogActionState, createCategoryAction } from "@/app/(app)/catalogo/actions";
import { Plus } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

export function CategoryForm() {
  const [state, action, pending] = useActionState<CatalogActionState, FormData>(createCategoryAction, {});
  const ref = useRef<HTMLFormElement>(null);
  const toast = useToast();
  const wasPending = useRef(false);
  useEffect(() => {
    if (pending) wasPending.current = true;
    else if (wasPending.current) {
      wasPending.current = false;
      if (!state.error && !state.nameError) {
        ref.current?.reset();
        toast.success("Categoría agregada.");
      }
    }
  }, [pending, state, toast]);

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
      {state.error && <Alert variant="danger">{state.error}</Alert>}
      <div className="form-actions">
        <Button type="submit" loading={pending}>
          <Plus aria-hidden="true" />
          {pending ? "Agregando…" : "Agregar categoría"}
        </Button>
      </div>
    </form>
  );
}
