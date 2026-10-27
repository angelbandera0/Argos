import { Trash2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Tooltip } from "@/components/ui/tooltip";
import { Specimen } from "../gallery";
import { ChipsDemo, DialogsDemo, ToastDemo } from "./avisos-demo";

const tones = ["info", "success", "warning", "danger"] as const;
const titles = { info: "Información", success: "Todo en orden", warning: "Revisa esto", danger: "Algo falló" };

export function AlertasSection() {
  return (
    <>
      <Specimen title="Alertas en línea" note="Cuatro tipos con título y cuerpo; danger usa role=alert, el resto status.">
        <div className="ui-grid">
          {tones.map((t) => (
            <Alert key={t} variant={t} title={titles[t]}>El cuerpo explica qué ocurrió y qué hacer.</Alert>
          ))}
        </div>
      </Specimen>
      <Specimen title="Con acción y cerrable">
        <div className="ui-grid">
          {tones.map((t) => (
            <Alert key={t} variant={t} title={titles[t]} dismissible action={<a href="#alertas">Ver detalle</a>}>
              Se puede cerrar con la cruz.
            </Alert>
          ))}
        </div>
      </Specimen>
      <Specimen title="Compacta" note="Una línea, para formularios y tarjetas.">
        <Card>{tones.map((t) => <Alert key={t} variant={t} compact>{titles[t]}: texto breve de una línea.</Alert>)}</Card>
      </Specimen>
    </>
  );
}

export function BannerSection() {
  return (
    <Specimen title="Banner de página" note="Uno a la vez en la app; aquí los cuatro tipos a modo de muestra.">
      <div className="ui-grid">
        <Banner variant="warning" icon="WifiOff" action={<Button size="sm" variant="secondary">Reintentar</Button>}>
          <strong>Sin conexión.</strong> Las ventas se guardarán al volver.
        </Banner>
        <Banner variant="info">La <strong>caja</strong> está cerrada.</Banner>
        <Banner variant="success">Datos sincronizados.</Banner>
        <Banner variant="danger" action={<Button size="sm" variant="secondary">Ver</Button>}><strong>Error de pago.</strong> Revisa el terminal.</Banner>
      </div>
    </Specimen>
  );
}

export function ToastSection() {
  return (
    <Specimen title="Notificaciones flotantes" note="Abajo a la derecha, máx. 3 visibles, 5 s con pausa al hover/foco; el error no se cierra solo. Escape cierra la enfocada.">
      <ToastDemo />
    </Specimen>
  );
}

export function DialogosSection() {
  return (
    <Specimen title="Dialog y AlertDialog" note="Base UI Dialog. Los popups de Select/Multiselect (--z-popup) quedan por encima; Escape cierra primero la lista y luego el diálogo. En móvil se abren como hoja inferior.">
      <DialogsDemo />
    </Specimen>
  );
}

export function InsigniasSection() {
  return (
    <>
      <Specimen title="Insignias" note="Estado con punto, nuevo y contador.">
        <div className="ui-row">
          <Badge variant="success">Pagado</Badge>
          <Badge variant="warning">Pendiente</Badge>
          <Badge variant="danger">Anulado</Badge>
          <Badge variant="neutral">Borrador</Badge>
          <Badge variant="new">Nuevo</Badge>
          <Badge variant="count" aria-label="12 pendientes">12</Badge>
        </div>
        <Card className="ui-row">
          <Badge variant="success">Pagado</Badge>
          <Badge variant="warning">Pendiente</Badge>
          <Badge variant="danger">Anulado</Badge>
          <Badge variant="neutral">Borrador</Badge>
          <Badge variant="new">Nuevo</Badge>
        </Card>
      </Specimen>
      <Specimen title="Chips" note="Estado con icono, de filtro (aria-pressed) y quitables.">
        <div className="ui-row">
          <Chip variant="success" icon="Check">Activo</Chip>
          <Chip variant="warning" icon="TriangleAlert">Aviso</Chip>
          <Chip variant="danger" icon="CircleAlert">Error</Chip>
          <Chip variant="info" icon="Info">Info</Chip>
        </div>
        <ChipsDemo />
      </Specimen>
    </>
  );
}

export function TooltipSection() {
  return (
    <Specimen title="Tooltip" note="Aparece al pasar el cursor o enfocar con Tab.">
      <div className="ui-row">
        {(["top", "bottom", "left", "right"] as const).map((s) => (
          <Tooltip key={s} label={`Ayuda arriba o a ${s}`} side={s}>
            <Button variant="secondary">{s}</Button>
          </Tooltip>
        ))}
        <Tooltip label="Eliminar producto">
          <Button variant="icon" aria-label="Eliminar producto" iconLeft={<Trash2 aria-hidden="true" />} />
        </Tooltip>
      </div>
    </Specimen>
  );
}
