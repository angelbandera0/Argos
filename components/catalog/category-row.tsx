"use client";

import { useState } from "react";
import { deleteCategoryAction } from "@/app/(app)/catalogo/actions";
import { Tags, Trash2 } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { CategoryDialog } from "./category-dialog";

export function CategoryRow({ id, name }: { id: string; name: string }) {
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function confirm() {
    setBusy(true);
    const r = await deleteCategoryAction(id);
    setBusy(false);
    if (r.error) setError(r.error);
    else {
      setDeleting(false);
      toast.success("Categoría eliminada.");
    }
  }

  return (
    <div className="list-row cat-row">
      <span className="icon-dot" aria-hidden="true">
        <Tags />
      </span>
      <strong>{name}</strong>
      <span className="row">
        <Button
          variant="secondary"
          onClick={() => setRenaming(true)}
          aria-label={`Renombrar ${name}`}
        >
          Renombrar
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setError(undefined);
            setDeleting(true);
          }}
          aria-label={`Eliminar ${name}`}
        >
          <Trash2 aria-hidden="true" />
          Eliminar
        </Button>
      </span>
      {renaming && (
        <CategoryDialog
          id={id}
          name={name}
          onClose={() => setRenaming(false)}
        />
      )}
      <AlertDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={confirm}
        confirmLabel={busy ? "Eliminando…" : "Eliminar categoría"}
        loading={busy}
        title={`¿Eliminar la categoría ${name}?`}
      >
        <p className="muted">
          La categoría dejará de aparecer. Si tiene productos, no se podrá
          eliminar.
        </p>
        {error && <Alert variant="danger">{error}</Alert>}
      </AlertDialog>
    </div>
  );
}
