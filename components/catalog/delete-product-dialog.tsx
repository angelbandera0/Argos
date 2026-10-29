"use client";

import { useState } from "react";
import { deleteProductAction } from "@/app/(app)/catalogo/actions";
import { Trash2 } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function DeleteProductDialog({
  productId,
  name,
  open: controlled,
  onClose,
}: {
  productId: string;
  name: string;
  open?: boolean;
  onClose?: () => void;
}) {
  const [inner, setInner] = useState(false);
  const open = controlled ?? inner;
  const setOpen = (v: boolean) => (setInner(v), !v && onClose?.());
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
      {controlled === undefined && (
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
      )}
      <AlertDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        confirmLabel={busy ? "Eliminando…" : "Eliminar producto"}
        loading={busy}
        title={`¿Eliminar ${name}?`}
      >
        <p className="muted">El producto dejará de aparecer en el catálogo.</p>
        {error && <Alert variant="danger">{error}</Alert>}
      </AlertDialog>
    </>
  );
}
