"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field } from "@/components/ui/field";
import { Multiselect } from "@/components/ui/multiselect";
import { RadioGroup } from "@/components/ui/radio-group";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { categorias } from "./categorias";

export function FormDemo() {
  const [out, setOut] = useState("");
  return (
    <form
      className="ui-panel ui-specimen-body"
      onSubmit={(e) => {
        e.preventDefault();
        const entries = [...new FormData(e.currentTarget).entries()].map(([k, v]) => `${k}=${String(v)}`);
        setOut(entries.join("\n"));
      }}
    >
      <Field label="Categoría" htmlFor="fd-cat"><Select id="fd-cat" name="categoria" required options={categorias} defaultValue="cafe" /></Field>
      <Field label="Etiquetas" htmlFor="fd-tags"><Multiselect id="fd-tags" name="etiquetas" options={categorias} defaultValue={["cafe", "pan"]} /></Field>
      <Checkbox name="acepta" label="Acepto" />
      <RadioGroup legend="Pago" name="pago" defaultValue="tarjeta" options={[{ value: "efectivo", label: "Efectivo" }, { value: "tarjeta", label: "Tarjeta" }]} />
      <Switch name="activo" label="Activo" defaultChecked />
      <div className="ui-row">
        <Button type="submit">Enviar</Button>
      </div>
      <pre aria-live="polite">{out || "Sin enviar"}</pre>
    </form>
  );
}
