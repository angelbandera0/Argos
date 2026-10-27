"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Datepicker, DateRangePicker } from "@/components/ui/datepicker";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { categorias } from "./categorias";

export function FechasForm() {
  const [out, setOut] = useState("");
  return (
    <form
      className="ui-panel ui-specimen-body"
      onSubmit={(e) => {
        e.preventDefault();
        setOut([...new FormData(e.currentTarget).entries()].map(([k, v]) => `${k}="${String(v)}"`).join("\n"));
      }}
    >
      <div className="ui-grid">
        <Field label="Entrega" htmlFor="fd-fecha"><Datepicker id="fd-fecha" name="entrega" defaultValue="2026-10-26" /></Field>
        <Field label="Periodo" htmlFor="fd-periodo"><DateRangePicker id="fd-periodo" nameFrom="desde" nameTo="hasta" defaultValue={{ from: "2026-10-20", to: "2026-10-26" }} /></Field>
        <Field label="Sin valor" htmlFor="fd-vacia"><Datepicker id="fd-vacia" name="vacia" /></Field>
      </div>
      <div className="ui-row">
        <Button type="submit">Enviar</Button>
      </div>
      <pre aria-live="polite">{out || "Sin enviar"}</pre>
    </form>
  );
}

export function FechasControlado() {
  const [value, setValue] = useState("2026-10-26");
  const [range, setRange] = useState({ from: "", to: "" });
  return (
    <div className="ui-grid">
      <Field label="Controlado" htmlFor="fc-1" hint={`Valor: ${value || "(vacío)"}`}>
        <Datepicker id="fc-1" value={value} onValueChange={setValue} aria-describedby="fc-1-hint" />
      </Field>
      <Field label="Rango controlado" htmlFor="fc-2" hint={`Valor: ${range.from || "…"} → ${range.to || "…"}`}>
        <DateRangePicker id="fc-2" value={range} onValueChange={setRange} aria-describedby="fc-2-hint" />
      </Field>
    </div>
  );
}

export function FechasDialogo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>Abrir diálogo con fechas</Button>
      <Dialog open={open} title="Fechas en un diálogo" onClose={() => setOpen(false)}>
        <Field label="Fecha" htmlFor="fdl-1"><Datepicker id="fdl-1" defaultValue="2026-10-26" /></Field>
        <Field label="Periodo" htmlFor="fdl-2"><DateRangePicker id="fdl-2" /></Field>
        <div className="modal-actions">
          <Button onClick={() => setOpen(false)}>Cerrar</Button>
        </div>
      </Dialog>
    </>
  );
}

export function FechasBarra() {
  return (
    <ListToolbar
      search={{ label: "Buscar", placeholder: "Buscar entidad o ID" }}
      filters={[{ name: "modulo", label: "Módulo", options: categorias }]}
      extra={
        <div className="list-toolbar-range">
          <DateRangePicker nameFrom="desde" nameTo="hasta" aria-label="Fechas" defaultValue={{ from: "2026-10-20", to: "2026-10-26" }} />
        </div>
      }
      submitLabel="Filtrar"
    />
  );
}
