"use client";

import { useState } from "react";
import { deleteProductAction } from "@/app/(app)/catalogo/actions";
import { AlertCircle, Trash2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export function DeleteProductDialog({ productId, name }: { productId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    const r = await deleteProductAction(productId);
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
        Eliminar producto
      </Button>
      {open && (
        <Dialog open title={`¿Eliminar ${name}?`} onClose={() => setOpen(false)}>
          <p className="muted">El producto dejará de aparecer en el catálogo.</p>
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
              {busy ? "Eliminando…" : "Eliminar producto"}
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}
