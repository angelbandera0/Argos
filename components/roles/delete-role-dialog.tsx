"use client";

import { useState } from "react";
import { deleteRoleAction } from "@/app/(app)/roles/actions";
import { Trash2 } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

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
      <AlertDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        confirmLabel={busy ? "Eliminando…" : "Eliminar rol"}
        loading={busy}
        title={`¿Eliminar el rol ${name}?`}
      >
        <p className="muted">El rol dejará de aparecer en tu lista. Si tiene usuarios asignados, no se podrá eliminar.</p>
        {error && <Alert variant="danger">{error}</Alert>}
      </AlertDialog>
    </>
  );
}
