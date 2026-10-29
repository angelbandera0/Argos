"use client";

import { useState } from "react";
import { Plus } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { useToast } from "@/components/ui/toast";
import { type ActionState, createSiteAction, createStoreAction } from "../actions";

export function NewUnitDialog({
  companyId,
  siteId,
  siteName,
  onClose,
}: {
  companyId: string;
  siteId?: string;
  siteName?: string;
  onClose: () => void;
}) {
  const toast = useToast();
  const [error, setError] = useState<string>();

  async function submit(formData: FormData) {
    const r: ActionState = siteId
      ? await createStoreAction(companyId, siteId, formData)
      : await createSiteAction(companyId, formData);
    if (r.error) return setError(r.error);
    toast.success(siteId ? "Tienda creada." : "Sede creada.");
    onClose();
  }

  return (
    <Dialog open title={siteId ? `Nueva tienda en ${siteName}` : "Nueva sede"} onClose={onClose}>
      <FormShell
        action={submit}
        error={error}
        submitLabel="Crear"
        pendingLabel="Creando…"
        cancel={
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        }
      >
        <Field label="Nombre" htmlFor="unit-name">
          <Input
            id="unit-name"
            name="name"
            required
            maxLength={80}
            autoComplete="off"
            aria-invalid={error ? true : undefined}
          />
        </Field>
      </FormShell>
    </Dialog>
  );
}

export function NewUnit({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        Nueva sede
      </Button>
      {open && <NewUnitDialog companyId={companyId} onClose={() => setOpen(false)} />}
    </>
  );
}
