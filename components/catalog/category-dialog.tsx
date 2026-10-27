"use client";

import { useState } from "react";
import { type CatalogActionState, createCategoryAction, renameCategoryAction } from "@/app/(app)/catalogo/actions";
import { Plus } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { FormDialog } from "@/components/ui/form-dialog";

export function CategoryDialog({ id, name = "", onClose }: { id?: string; name?: string; onClose: () => void }) {
  const [value, setValue] = useState(name);
  return (
    <FormDialog<CatalogActionState>
      title={id ? "Renombrar categoría" : "Nueva categoría"}
      description={id ? `Cambia el nombre de ${name}.` : "Las categorías agrupan los productos de la compañía."}
      action={id ? renameCategoryAction.bind(null, id) : createCategoryAction}
      successMessage={id ? "Categoría renombrada." : "Categoría agregada."}
      onClose={onClose}
    >
      {(state) => (
        <Field label="Nombre" htmlFor="category-name" error={state.nameError}>
          <Input
            id="category-name"
            name="name"
            required
            maxLength={80}
            autoComplete="off"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            aria-describedby={state.nameError ? "category-name-error" : undefined}
            aria-invalid={state.nameError ? true : undefined}
          />
        </Field>
      )}
    </FormDialog>
  );
}

export function NewCategoryButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        Nueva categoría
      </Button>
      {open && <CategoryDialog onClose={() => setOpen(false)} />}
    </>
  );
}
