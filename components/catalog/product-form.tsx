"use client";

import Link from "next/link";
import { useActionState } from "react";
import { type CatalogActionState, saveProductAction } from "@/app/(app)/catalogo/actions";
import { Alert } from "@/components/ui/alert";
import { buttonClass } from "@/components/ui/button-class";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export function ProductForm({
  productId,
  initial,
  categories,
  readOnlyReason,
}: {
  productId: string | null;
  initial: { name: string; categoryId: string; description: string; active: boolean };
  categories: { id: string; name: string }[];
  readOnlyReason?: string;
}) {
  const [state, action, pending] = useActionState<CatalogActionState, FormData>(saveProductAction.bind(null, productId), {});
  const locked = Boolean(readOnlyReason);

  const card = (
    <Card aria-labelledby="h-prod">
      <h2 className="h2" id="h-prod">
        Datos del producto
      </h2>
      <Field label="Nombre" htmlFor="name" error={state.nameError}>
        <Input
          id="name"
          name="name"
          required
          maxLength={80}
          autoComplete="off"
          defaultValue={initial.name}
          disabled={locked}
          aria-describedby={state.nameError ? "name-error" : undefined}
          aria-invalid={state.nameError ? true : undefined}
        />
      </Field>
      <Field label="Categoría" htmlFor="categoryId">
        <Select
          id="categoryId"
          name="categoryId"
          required
          disabled={locked}
          placeholder="Elige una categoría"
          options={categories.map((c) => ({ value: c.id, label: c.name }))}
          defaultValue={initial.categoryId || null}
        />
      </Field>
      <Field label="Descripción (opcional)" htmlFor="description">
        <Textarea id="description" name="description" maxLength={500} counter disabled={locked} defaultValue={initial.description} />
      </Field>
      <Switch
        name="active"
        label="Activo"
        description="Un producto inactivo no se ofrece en ventas."
        disabled={locked}
        defaultChecked={initial.active}
      />
    </Card>
  );

  if (locked) {
    return (
      <div className="form-shell">
        <Alert variant="info">
          {readOnlyReason}
        </Alert>
        {card}
        <div className="form-shell-actions">
          <Link className={buttonClass("secondary", "md")} href="/catalogo/productos">
            Volver
          </Link>
        </div>
      </div>
    );
  }

  return (
    <FormShell
      action={action}
      error={state.error}
      pending={pending}
      submitLabel="Guardar producto"
      cancel={
        <Link className={buttonClass("secondary", "md")} href="/catalogo/productos">
          Cancelar
        </Link>
      }
    >
      {card}
    </FormShell>
  );
}
