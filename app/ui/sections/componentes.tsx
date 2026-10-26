import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Field, Input } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Specimen } from "../gallery";
import { DialogDemo } from "./dialog-demo";

const variants = ["primary", "secondary", "ghost", "icon"] as const;

function ButtonRows() {
  return variants.map((v) => {
    const content = v === "icon" ? <Plus aria-hidden="true" /> : `Botón ${v}`;
    const extra = v === "icon" ? { "aria-label": "Añadir" } : {};
    return (
      <div className="ui-row" key={v}>
        <Button variant={v} {...extra}>{content}</Button>
        <Button variant={v} disabled {...extra}>{content}</Button>
        <Button variant={v} loading {...extra}>{content}</Button>
      </div>
    );
  });
}

export function Componentes() {
  return (
    <>
      <Specimen title="Button" note="Normal, desactivado y cargando; sobre blanco y sobre panel.">
        <div className="ui-specimen-body"><ButtonRows /></div>
        <div className="ui-panel ui-specimen-body"><ButtonRows /></div>
      </Specimen>
      <Specimen title="Chip" note="neutral, alert, open y ring.">
        <div className="ui-row">
          <Chip>Neutro</Chip>
          <Chip variant="alert">Alerta</Chip>
          <Chip variant="open">Abierto</Chip>
          <Chip variant="ring">Anillo</Chip>
        </div>
        <Card className="ui-row">
          <Chip>Neutro</Chip>
          <Chip variant="alert">Alerta</Chip>
          <Chip variant="open">Abierto</Chip>
          <Chip variant="ring">Anillo</Chip>
        </Card>
      </Specimen>
      <Specimen title="Card">
        <Card>
          <h3 className="h2">Título de tarjeta</h3>
          <span className="caption">Panel sin borde ni sombra.</span>
        </Card>
      </Specimen>
      <Specimen title="Field e Input" note="Normal, con ayuda, con error y desactivado.">
        <div className="ui-grid">
          <Field label="Normal" htmlFor="g-normal">
            <Input id="g-normal" placeholder="Escribe aquí" />
          </Field>
          <Field label="Con ayuda" htmlFor="g-hint" hint="Texto de ayuda.">
            <Input id="g-hint" aria-describedby="g-hint-hint" />
          </Field>
          <Field label="Con error" htmlFor="g-error" error="Escribe al menos 3 caracteres.">
            <Input id="g-error" aria-invalid="true" aria-describedby="g-error-error" defaultValue="ab" />
          </Field>
          <Field label="Desactivado" htmlFor="g-disabled">
            <Input id="g-disabled" disabled defaultValue="No editable" />
          </Field>
        </div>
        <Card className="ui-grid">
          <Field label="Dentro de tarjeta" htmlFor="g-card">
            <Input id="g-card" />
          </Field>
        </Card>
      </Specimen>
      <Specimen title="Dialog" note="Descartable (Escape) y no descartable.">
        <DialogDemo />
      </Specimen>
      <Specimen title="Skeleton" note="Sobre blanco y sobre panel.">
        {[false, true].map((onPanel) => {
          const body = (
            <>
              <Skeleton variant="title" onPanel={onPanel} />
              <Skeleton variant="text" onPanel={onPanel} />
              <Skeleton variant="pill" onPanel={onPanel} />
              <Skeleton variant="circle" onPanel={onPanel} />
              <Skeleton variant="block" onPanel={onPanel} style={{ height: "var(--size-list-row)" }} />
            </>
          );
          return onPanel ? <div className="ui-panel ui-specimen-body" key="p">{body}</div> : <div className="ui-specimen-body" key="s">{body}</div>;
        })}
      </Specimen>
      <Specimen title="Spinner" note="Hereda el color del texto.">
        <div className="ui-row">
          <Spinner />
          <span style={{ color: "var(--color-red-strong)" }}><Spinner /></span>
          <span style={{ color: "var(--color-muted)" }}><Spinner /></span>
        </div>
      </Specimen>
    </>
  );
}
