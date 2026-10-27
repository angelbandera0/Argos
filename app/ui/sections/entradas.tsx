import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Select } from "@/components/ui/select";
import { Multiselect } from "@/components/ui/multiselect";
import { Specimen } from "../gallery";
import { FormDemo } from "./entradas-demo";
import { categorias } from "./categorias";


const variants = ["primary", "secondary", "outline", "accent", "ghost", "danger"] as const;
const focusStyle = { boxShadow: "var(--focus-ring)" };

function ButtonMatrix() {
  return variants.map((v) => (
    <div className="ui-row" key={v}>
      <Button variant={v}>Guardar</Button>
      <Button variant={v} style={focusStyle}>Foco</Button>
      <Button variant={v} disabled>Desactivado</Button>
      <Button variant={v} loading>Cargando</Button>
      <Button variant={v} iconLeft={<Plus aria-hidden="true" />}>Con icono</Button>
      <Button variant={v} iconRight={<Search aria-hidden="true" />}>Icono derecha</Button>
    </div>
  ));
}

export function BotonesSection() {
  return (
    <>
      <Specimen title="Variantes y estados" note="Normal, foco simulado, desactivado, cargando e iconos. Pasa el cursor para ver hover.">
        <ButtonMatrix />
        <div className="ui-panel ui-specimen-body"><ButtonMatrix /></div>
      </Specimen>
      <Specimen title="Tamaños" note="sm 36, md 40 (44 táctil), lg 52.">
        <div className="ui-row">
          {(["sm", "md", "lg"] as const).map((s) => (
            <Button key={s} size={s}>Tamaño {s}</Button>
          ))}
        </div>
      </Specimen>
      <Specimen title="Solo icono" note="aria-label y title obligatorios.">
        <div className="ui-row">
          {(["sm", "md", "lg"] as const).map((s) => (
            <Button key={s} variant="icon" size={s} aria-label="Añadir"><Plus aria-hidden="true" /></Button>
          ))}
          <Button variant="icon" aria-label="Añadir" disabled><Plus aria-hidden="true" /></Button>
          <Button variant="icon" aria-label="Añadir" loading><Plus aria-hidden="true" /></Button>
        </div>
      </Specimen>
    </>
  );
}

export function CamposSection() {
  return (
    <>
      <Specimen title="Input" note="Variante filled (actual) y outline (guía §6.17): normal, foco, con valor, error, desactivado, solo lectura.">
        {(["filled", "outline"] as const).map((variant) => (
          <div className="ui-grid" key={variant}>
            <Field label="Normal" htmlFor={`i-${variant}-n`} hint="Visible en el ticket.">
              <Input variant={variant} id={`i-${variant}-n`} placeholder="Escribe aquí" aria-describedby={`i-${variant}-n-hint`} />
            </Field>
            <Field label="Foco (simulado)" htmlFor={`i-${variant}-f`} optional>
              <Input variant={variant} id={`i-${variant}-f`} defaultValue="Café ameri" style={{ boxShadow: "inset 0 0 0 var(--border-field-active) var(--color-red-strong), var(--focus-ring-field)" }} />
            </Field>
            <Field label="Con valor" htmlFor={`i-${variant}-v`}>
              <Input variant={variant} id={`i-${variant}-v`} defaultValue="Café americano" />
            </Field>
            <Field label="Con error" htmlFor={`i-${variant}-e`} error="Escribe al menos 3 caracteres.">
              <Input variant={variant} id={`i-${variant}-e`} defaultValue="Ca" aria-invalid="true" aria-describedby={`i-${variant}-e-error`} />
            </Field>
            <Field label="Desactivado" htmlFor={`i-${variant}-d`}>
              <Input variant={variant} id={`i-${variant}-d`} defaultValue="No editable" disabled />
            </Field>
            <Field label="Solo lectura" htmlFor={`i-${variant}-r`}>
              <Input variant={variant} id={`i-${variant}-r`} defaultValue="Se copia, no se edita" readOnly />
            </Field>
          </div>
        ))}
        <Card className="ui-grid">
          <Field label="Dentro de tarjeta" htmlFor="i-card"><Input id="i-card" /></Field>
          <Field label="Error en tarjeta" htmlFor="i-card-e" error="Campo obligatorio."><Input id="i-card-e" aria-invalid="true" /></Field>
        </Card>
      </Specimen>
      <Specimen title="Textarea" note="Con contador n/200, error, desactivado y solo lectura.">
        <div className="ui-grid">
          <Field label="Notas" htmlFor="t-n" hint="Visible en el ticket."><Textarea id="t-n" maxLength={200} counter defaultValue="Sin azúcar" /></Field>
          <Field label="Outline" htmlFor="t-o"><Textarea id="t-o" variant="outline" maxLength={200} counter /></Field>
          <Field label="Con error" htmlFor="t-e" error="Describe el motivo."><Textarea id="t-e" variant="outline" aria-invalid="true" aria-describedby="t-e-error" /></Field>
          <Field label="Desactivado" htmlFor="t-d"><Textarea id="t-d" variant="outline" disabled defaultValue="No editable" /></Field>
          <Field label="Solo lectura" htmlFor="t-r"><Textarea id="t-r" variant="outline" readOnly defaultValue="Solo lectura" /></Field>
        </div>
      </Specimen>
    </>
  );
}

export function ChecksSection() {
  return (
    <>
      <Specimen title="Checkbox" note="Sin marcar, marcado, indeterminado, desactivado.">
        <div className="ui-grid">
          <Checkbox label="Café" />
          <Checkbox label="Panadería" defaultChecked />
          <Checkbox label="Bebidas (2 de 5)" indeterminate />
          <Checkbox label="Temporada" description="No disponible ahora." disabled />
          <Checkbox label="Temporada marcada" defaultChecked disabled />
        </div>
      </Specimen>
      <Specimen title="RadioGroup" note="Grupo con fieldset y legend; una opción desactivada.">
        <div className="ui-grid">
          <RadioGroup legend="Método de pago" defaultValue="tarjeta" options={[
            { value: "efectivo", label: "Efectivo" },
            { value: "tarjeta", label: "Tarjeta" },
            { value: "credito", label: "Crédito de tienda", disabled: true },
          ]} />
          <RadioGroup legend="Grupo desactivado" disabled defaultValue="a" options={[{ value: "a", label: "Opción A" }, { value: "b", label: "Opción B" }]} />
        </div>
      </Specimen>
      <Specimen title="Switch">
        <div className="ui-grid">
          <Switch label="Imprimir ticket" description="Al cerrar cada venta" defaultChecked />
          <Switch label="Sonido de nuevo pedido" />
          <Switch label="Modo sin conexión" description="Lo activa el administrador" disabled />
          <Switch label="Activo y desactivado" defaultChecked disabled />
        </div>
      </Specimen>
    </>
  );
}

export function SelectSection() {
  return (
    <Specimen title="Select" note="Vacío, con valor, error, desactivado y con opción desactivada. Teclado: flechas, Enter, Esc.">
      <div className="ui-grid">
        <Field label="Vacío" htmlFor="s-v"><Select id="s-v" options={categorias} /></Field>
        <Field label="Con valor" htmlFor="s-c"><Select id="s-c" options={categorias} defaultValue="pan" /></Field>
        <Field label="Con error" htmlFor="s-e" error="Elige una categoría."><Select id="s-e" options={categorias} invalid aria-describedby="s-e-error" /></Field>
        <Field label="Desactivado" htmlFor="s-d"><Select id="s-d" options={categorias} defaultValue="cafe" disabled /></Field>
      </div>
    </Specimen>
  );
}

export function MultiselectSection() {
  return (
    <>
      <Specimen title="Multiselect" note="Vacío, varios elegidos (máx. 3 + N), error y desactivado. Escribe «zzz» para ver «Sin resultados».">
        <div className="ui-grid">
          <Field label="Vacío" htmlFor="m-v"><Multiselect id="m-v" options={categorias} /></Field>
          <Field label="Varios elegidos" htmlFor="m-c"><Multiselect id="m-c" options={categorias} defaultValue={["cafe", "pan", "bebidas", "postres", "snacks"]} /></Field>
          <Field label="Con error" htmlFor="m-e" error="Elige al menos una."><Multiselect id="m-e" options={categorias} invalid aria-describedby="m-e-error" /></Field>
          <Field label="Desactivado" htmlFor="m-d"><Multiselect id="m-d" options={categorias} defaultValue={["cafe"]} disabled /></Field>
        </div>
      </Specimen>
      <Specimen title="Envío en FormData" note="Comprueba lo que recibiría una server action.">
        <FormDemo />
      </Specimen>
    </>
  );
}
