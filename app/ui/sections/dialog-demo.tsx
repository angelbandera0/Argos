"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { FormDialog, type FormDialogState } from "@/components/ui/form-dialog";

async function demoSave(_: FormDialogState, formData: FormData): Promise<FormDialogState> {
  await new Promise((r) => setTimeout(r, 600));
  return String(formData.get("name") ?? "").trim() ? {} : { nameError: "Escribe un nombre." };
}

export function DialogDemo() {
  const [form, setForm] = useState(false);
  const [mode, setMode] = useState<"normal" | "locked" | null>(null);
  const close = () => setMode(null);
  return (
    <>
      <div className="ui-row">
        <Button variant="secondary" onClick={() => setMode("normal")}>
          Abrir diálogo
        </Button>
        <Button variant="secondary" onClick={() => setMode("locked")}>
          Abrir diálogo no descartable
        </Button>
        <Button variant="secondary" onClick={() => setForm(true)}>
          Abrir FormDialog
        </Button>
      </div>
      <Dialog open={mode !== null} title="Título del diálogo" dismissible={mode !== "locked"} onClose={close}>
        <p>{mode === "locked" ? "Escape no lo cierra; usa el botón." : "Escape o el botón lo cierran."}</p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={close}>
            Cancelar
          </Button>
          <Button onClick={close}>Aceptar</Button>
        </div>
      </Dialog>
      {form && (
        <FormDialog
          title="Nueva categoría"
          description="Envía vacío para ver el error de campo; con nombre se cierra y muestra un aviso."
          action={demoSave}
          successMessage="Guardado."
          onClose={() => setForm(false)}
        >
          {(state) => (
            <Field label="Nombre" htmlFor="fd-name" error={state.nameError}>
              <Input id="fd-name" name="name" autoComplete="off" aria-invalid={state.nameError ? true : undefined} />
            </Field>
          )}
        </FormDialog>
      )}
    </>
  );
}
