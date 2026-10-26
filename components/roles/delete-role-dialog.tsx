"use client";

import { useState } from "react";
import { deleteRoleAction } from "@/app/(app)/roles/actions";
import { AlertCircle, Trash2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export function DeleteRoleDialog({ roleId, name }: { roleId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    const r = await deleteRoleAction(roleId);
    setBusy(false);
    if (r?.error) setError(r.error);
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
        <Trash2 aria-hidden="true" />
        Eliminar rol
      </Button>
      {open && (
        <Dialog open title={`¿Eliminar el rol ${name}?`} onClose={() => setOpen(false)}>
          <p className="muted">El rol dejará de aparecer en tu lista. Si tiene usuarios asignados, no se podrá eliminar.</p>
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
            <Button loading={busy} onClick={confirm}>
              {busy ? "Eliminando…" : "Eliminar rol"}
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}
