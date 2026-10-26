"use client";

import Link from "next/link";
import { useActionState } from "react";
import { type CatalogActionState, saveProductAction } from "@/app/(app)/catalogo/actions";
import { AlertCircle, Lock } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";

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

  return (
    <form className="stack" action={action}>
      {readOnlyReason && (
        <div className="notice" id="ro-reason">
          <Lock aria-hidden="true" />
          <p>{readOnlyReason}</p>
        </div>
      )}
      <Card aria-labelledby="h-prod">
        <h2 className="h2" id="h-prod">
          Datos del producto
        </h2>
        <fieldset className="stack" disabled={locked} aria-describedby={locked ? "ro-reason" : undefined}>
          <Field label="Nombre" htmlFor="name" error={state.nameError}>
            <Input
              id="name"
              name="name"
              required
              maxLength={80}
              autoComplete="off"
              defaultValue={initial.name}
              aria-describedby={state.nameError ? "name-error" : undefined}
              aria-invalid={state.nameError ? true : undefined}
            />
          </Field>
          <Field label="Categoría" htmlFor="categoryId">
            <select className="select" id="categoryId" name="categoryId" required defaultValue={initial.categoryId}>
              <option value="" disabled>
                Elige una categoría
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Descripción (opcional)" htmlFor="description">
            <textarea className="textarea" id="description" name="description" maxLength={500} defaultValue={initial.description} />
          </Field>
          <label className="list-row switch-row">
            <span>
              <strong>Activo</strong>
              <br />
              <span className="caption">Un producto inactivo no se ofrece en ventas.</span>
            </span>
            <input className="switch" type="checkbox" role="switch" name="active" defaultChecked={initial.active} />
          </label>
        </fieldset>
      </Card>
      {state.error && (
        <p className="form-error" role="alert">
          <AlertCircle aria-hidden="true" />
          {state.error}
        </p>
      )}
      <div className="form-actions">
        {!locked && (
          <Button type="submit" loading={pending}>
            {pending ? "Guardando…" : "Guardar producto"}
          </Button>
        )}
        <Link className="btn btn-secondary" href="/catalogo/productos">
          {locked ? "Volver" : "Cancelar"}
        </Link>
      </div>
    </form>
  );
}
