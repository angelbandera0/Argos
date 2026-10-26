"use client";

import { useActionState, useState } from "react";
import { type CatalogActionState, deleteCategoryAction, renameCategoryAction } from "@/app/(app)/catalogo/actions";
import { Tags, Trash2 } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";

function Rename({ id, name, onDone }: { id: string; name: string; onDone: () => void }) {
  const toast = useToast();
  const [state, action, pending] = useActionState<CatalogActionState, FormData>(
    async (prev, fd) => {
      const r = await renameCategoryAction(id, prev, fd);
      if (!r.error && !r.nameError) {
        toast.success("Categoría renombrada.");
        onDone();
      }
      return r;
    },
    {},
  );
  return (
    <form className="row" action={action}>
      <Field label={`Nuevo nombre de ${name}`} htmlFor={`name-${id}`} error={state.nameError ?? state.error}>
        <Input id={`name-${id}`} name="name" required maxLength={80} autoComplete="off" defaultValue={name} />
      </Field>
      <Button type="submit" loading={pending}>
        {pending ? "Guardando…" : "Guardar"}
      </Button>
      <Button variant="secondary" onClick={onDone}>
        Cancelar
      </Button>
    </form>
  );
}

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
      {renaming ? (
        <Rename id={id} name={name} onDone={() => setRenaming(false)} />
      ) : (
        <>
          <strong>{name}</strong>
          <span className="row">
            <Button variant="secondary" onClick={() => setRenaming(true)} aria-label={`Renombrar ${name}`}>
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
        </>
      )}
      <AlertDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        onConfirm={confirm}
        confirmLabel={busy ? "Eliminando…" : "Eliminar categoría"}
        loading={busy}
        title={`¿Eliminar la categoría ${name}?`}
      >
        <p className="muted">La categoría dejará de aparecer. Si tiene productos, no se podrá eliminar.</p>
        {error && <Alert variant="danger">{error}</Alert>}
      </AlertDialog>
    </div>
  );
}
