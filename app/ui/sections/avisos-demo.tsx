"use client";

import { useState } from "react";
import { Alert } from "@/components/ui/alert";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Multiselect } from "@/components/ui/multiselect";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { categorias } from "./categorias";

export function ToastDemo() {
  const toast = useToast();
  return (
    <div className="ui-row">
      <Button variant="secondary" onClick={() => toast.success("Venta guardada", { description: "Se cerrará sola en 5 s." })}>Éxito</Button>
      <Button variant="secondary" onClick={() => toast.info("Sincronizando", { description: "Pasa el cursor para pausar.", action: { label: "Ver", onClick: () => {} } })}>Info con acción</Button>
      <Button variant="secondary" onClick={() => toast.warning("Stock bajo", { description: "Quedan 3 unidades." })}>Aviso</Button>
      <Button variant="secondary" onClick={() => toast.error("No se pudo guardar", { description: "No se cierra sola.", action: { label: "Reintentar", onClick: () => {} } })}>Error</Button>
      <Button variant="ghost" onClick={() => { for (let i = 1; i <= 5; i++) toast.info(`Notificación ${i}`); }}>Apilar 5 (máx. 3 visibles)</Button>
      <Button variant="ghost" onClick={() => toast.close()}>Cerrar todas</Button>
    </div>
  );
}

function Selects({ id }: { id: string }) {
  return (
    <>
      <Field label="Categoría" htmlFor={`${id}-s`}><Select id={`${id}-s`} options={categorias} defaultValue="cafe" /></Field>
      <Field label="Etiquetas" htmlFor={`${id}-m`}><Multiselect id={`${id}-m`} options={categorias} defaultValue={["pan"]} /></Field>
    </>
  );
}

export function DialogsDemo() {
  const [open, setOpen] = useState<"form" | "sm" | "lg" | "locked" | "alert" | "alert-select" | null>(null);
  const [busy, setBusy] = useState(false);
  const close = () => setOpen(null);
  const confirm = () => {
    setBusy(true);
    setTimeout(() => { setBusy(false); close(); }, 1200);
  };
  return (
    <>
      <div className="ui-row">
        <Button variant="secondary" onClick={() => setOpen("sm")}>Confirmación (420)</Button>
        <Button variant="secondary" onClick={() => setOpen("form")}>Formulario con select (480)</Button>
        <Button variant="secondary" onClick={() => setOpen("lg")}>Grande (560)</Button>
        <Button variant="secondary" onClick={() => setOpen("locked")}>No descartable</Button>
        <Button variant="danger" onClick={() => setOpen("alert")}>AlertDialog</Button>
        <Button variant="danger" onClick={() => setOpen("alert-select")}>AlertDialog con select</Button>
      </div>
      <Dialog open={open === "sm"} size="sm" icon="TriangleAlert" tone="warning" title="¿Cerrar el turno?" description="Revisa que la caja esté cuadrada antes de continuar." onClose={close}
        footer={<><Button variant="secondary" onClick={close}>Cancelar</Button><Button onClick={close}>Cerrar turno</Button></>} />
      <Dialog open={open === "form"} showClose title="Editar producto" onClose={close}
        footer={<><Button variant="secondary" onClick={close}>Cancelar</Button><Button onClick={close}>Guardar</Button></>}>
        <Selects id="dlg" />
        <Alert variant="info" compact>Escape cierra primero la lista abierta y luego el diálogo.</Alert>
      </Dialog>
      <Dialog open={open === "lg"} size="lg" showClose title="Diálogo grande" onClose={close}>
        <p>Contenido libre en el cuerpo.</p>
        <div className="modal-actions"><Button onClick={close}>Aceptar</Button></div>
      </Dialog>
      <Dialog open={open === "locked"} title="No descartable" dismissible={false}>
        <p>Escape, clic fuera y la cruz no lo cierran; solo el botón.</p>
        <div className="modal-actions"><Button onClick={close}>Entendido</Button></div>
      </Dialog>
      <AlertDialog open={open === "alert"} title="¿Anular la venta?" description="Se devolverán los productos al inventario." confirmLabel="Anular venta" cancelLabel="Mantener venta" loading={busy} onClose={close} onConfirm={confirm}>
        <p><strong>Esta acción no se puede deshacer.</strong> El foco inicial está en Cancelar.</p>
      </AlertDialog>
      <AlertDialog open={open === "alert-select"} size="md" title="¿Eliminar la categoría?" confirmLabel="Eliminar" onClose={close} onConfirm={close}>
        <Selects id="adlg" />
      </AlertDialog>
    </>
  );
}

export function ChipsDemo() {
  const [on, setOn] = useState({ a: true, b: false });
  const [tags, setTags] = useState(["Café", "Panadería", "Bebidas"]);
  return (
    <>
      <div className="ui-row">
        <Chip pressed={on.a} onPressedChange={(v) => setOn({ ...on, a: v })}>Activos</Chip>
        <Chip pressed={on.b} onPressedChange={(v) => setOn({ ...on, b: v })}>Con stock</Chip>
      </div>
      <div className="ui-row">
        {tags.map((t) => (
          <Chip key={t} onRemove={() => setTags(tags.filter((x) => x !== t))} removeLabel={`Quitar ${t}`}>{t}</Chip>
        ))}
        {tags.length === 0 && <Button size="sm" variant="ghost" onClick={() => setTags(["Café", "Panadería", "Bebidas"])}>Restaurar</Button>}
      </div>
    </>
  );
}
