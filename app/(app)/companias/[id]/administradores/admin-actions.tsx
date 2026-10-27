"use client";

import { useState } from "react";
import { UserMinus, UserPlus } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { grantAccessAction, revokeAccessAction } from "../../actions";

export function GrantAccess({
  companyId,
  candidates,
}: {
  companyId: string;
  candidates: { id: string; name: string }[];
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(formData: FormData) {
    const r = await grantAccessAction(companyId, String(formData.get("adminId") ?? ""));
    if (r.error) return setError(r.error);
    toast.success("Acceso concedido.");
    setOpen(false);
  }

  const close = () => setOpen(false);

  return (
    <>
      <Button
        onClick={() => {
          setError(undefined);
          setOpen(true);
        }}
      >
        <UserPlus aria-hidden="true" />
        Dar acceso
      </Button>
      {open && (
        <Dialog open title="Dar acceso a un administrador" onClose={close}>
          {candidates.length === 0 ? (
            <div className="stack">
              <p className="muted">No hay otros administradores disponibles para esta compañía.</p>
              <div className="modal-actions">
                <Button variant="secondary" onClick={close}>
                  Cerrar
                </Button>
              </div>
            </div>
          ) : (
            <FormShell
              action={submit}
              submitLabel="Dar acceso"
              cancel={
                <Button variant="secondary" onClick={close}>
                  Cancelar
                </Button>
              }
            >
              <Field label="Administrador" htmlFor="adminId" error={error}>
                <Select
                  id="adminId"
                  name="adminId"
                  required
                  invalid={!!error}
                  placeholder="Elige un administrador"
                  options={candidates.map((c) => ({ value: c.id, label: c.name }))}
                />
              </Field>
            </FormShell>
          )}
        </Dialog>
      )}
    </>
  );
}

export function RevokeAccess({ companyId, adminId, name }: { companyId: string; adminId: string; name: string }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  async function confirm() {
    setBusy(true);
    const r = await revokeAccessAction(companyId, adminId);
    setBusy(false);
    if (r.error) return setError(r.error);
    toast.success(`Acceso de ${name} retirado.`);
    setOpen(false);
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
        <UserMinus aria-hidden="true" />
        Quitar acceso
        <span className="sr-only"> a {name}</span>
      </Button>
      {open && (
        <AlertDialog
          open
          title={`¿Quitar el acceso a ${name}?`}
          icon="Users"
          confirmLabel="Quitar acceso"
          loading={busy}
          onConfirm={confirm}
          onClose={() => setOpen(false)}
        >
          <p className="muted">{name} dejará de ver y administrar esta compañía. Puedes darle acceso de nuevo cuando quieras.</p>
          {error && <Alert variant="danger">{error}</Alert>}
        </AlertDialog>
      )}
    </>
  );
}
