"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { type ActionState, createSiteAction, createStoreAction } from "../actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Creando…" : "Crear"}
    </Button>
  );
}

export function NewUnit({
  companyId,
  siteId,
  siteName,
}: {
  companyId: string;
  siteId?: string;
  siteName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const store = !!siteId;

  async function submit(formData: FormData) {
    const r: ActionState = siteId
      ? await createStoreAction(companyId, siteId, formData)
      : await createSiteAction(companyId, formData);
    if (r.error) setError(r.error);
    else setOpen(false);
  }

  return (
    <>
      <Button
        variant="secondary"
        onClick={() => {
          setError(undefined);
          setOpen(true);
        }}
      >
        <Plus aria-hidden="true" />
        {store ? "Nueva tienda" : "Nueva sede"}
        {store && <span className="sr-only"> en {siteName}</span>}
      </Button>
      {open && (
        <Dialog open title={store ? `Nueva tienda en ${siteName}` : "Nueva sede"} onClose={() => setOpen(false)}>
          <form className="auth-form" action={submit}>
            <Field label="Nombre" htmlFor="unit-name" error={error}>
              <Input
                id="unit-name"
                name="name"
                required
                maxLength={80}
                autoComplete="off"
                aria-invalid={error ? true : undefined}
              />
            </Field>
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Submit />
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}
