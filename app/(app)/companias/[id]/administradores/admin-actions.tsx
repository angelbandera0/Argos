"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, UserMinus, UserPlus } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { grantAccessAction, revokeAccessAction } from "../../actions";

function Submit({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? busy : label}
    </Button>
  );
}

export function GrantAccess({
  companyId,
  candidates,
}: {
  companyId: string;
  candidates: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(formData: FormData) {
    const r = await grantAccessAction(companyId, String(formData.get("adminId") ?? ""));
    if (r.error) setError(r.error);
    else setOpen(false);
  }

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
        <Dialog open title="Dar acceso a un administrador" onClose={() => setOpen(false)}>
          {candidates.length === 0 ? (
            <div className="stack">
              <p className="muted">No hay otros administradores disponibles para esta compañía.</p>
              <div className="modal-actions">
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Cerrar
                </Button>
              </div>
            </div>
          ) : (
            <form className="stack" action={submit}>
              <Field label="Administrador" htmlFor="adminId" error={error}>
                <select id="adminId" name="adminId" className="input" required defaultValue="">
                  <option value="" disabled>
                    Elige un administrador
                  </option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="modal-actions">
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Submit label="Dar acceso" busy="Guardando…" />
              </div>
            </form>
          )}
        </Dialog>
      )}
    </>
  );
}

export function RevokeAccess({ companyId, adminId, name }: { companyId: string; adminId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();

  async function submit() {
    const r = await revokeAccessAction(companyId, adminId);
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
        <UserMinus aria-hidden="true" />
        Quitar acceso
        <span className="sr-only"> a {name}</span>
      </Button>
      {open && (
        <Dialog open title={`¿Quitar el acceso a ${name}?`} onClose={() => setOpen(false)}>
          <form className="stack" action={submit}>
            <p className="muted">{name} dejará de ver y administrar esta compañía. Puedes darle acceso de nuevo cuando quieras.</p>
            {error && (
              <p className="form-error" role="alert">
                <AlertCircle aria-hidden="true" />
                {error}
              </p>
            )}
            <div className="modal-actions">
              <Button variant="secondary" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Submit label="Quitar acceso" busy="Quitando…" />
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}
