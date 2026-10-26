import { Datepicker, DateRangePicker } from "@/components/ui/datepicker";
import { Field } from "@/components/ui/field";
import { Specimen } from "../gallery";
import { FechasBarra, FechasControlado, FechasDialogo, FechasForm } from "./fechas-demo";

const HOY = "2026-10-26";

export function DatepickerSection() {
  return (
    <>
      <Specimen title="Fecha única" note="Escribe dd/mm/aaaa (las barras se insertan) o abre el calendario con el icono o ↓. Flechas, Inicio/Fin, RePág/AvPág (Mayús = año), Enter, Esc.">
        <div className="ui-grid">
          <Field label="Vacío" htmlFor="dp-v"><Datepicker id="dp-v" today={HOY} /></Field>
          <Field label="Con valor" htmlFor="dp-c"><Datepicker id="dp-c" defaultValue="2026-10-26" today={HOY} /></Field>
          <Field label="Con error" htmlFor="dp-e" error="Esa fecha no existe. Febrero tiene 28 días en 2026."><Datepicker id="dp-e" defaultValue="2026-10-26" invalid aria-describedby="dp-e-error" today={HOY} /></Field>
          <Field label="Desactivado" htmlFor="dp-d"><Datepicker id="dp-d" defaultValue="2026-10-26" disabled /></Field>
          <Field label="Entre 10 y 28 de octubre" htmlFor="dp-m" hint="min y max deshabilitan el resto."><Datepicker id="dp-m" defaultValue="2026-10-15" min="2026-10-10" max="2026-10-28" today={HOY} aria-describedby="dp-m-hint" /></Field>
          <Field label="Solo desde hoy (entregas)" htmlFor="dp-f"><Datepicker id="dp-f" min={HOY} today={HOY} /></Field>
        </div>
      </Specimen>
      <Specimen title="Rango con atajos" note="Primer clic = inicio, segundo = fin (se intercambian). Aplicar confirma; Cancelar y Esc descartan.">
        <div className="ui-grid">
          <Field label="Con valor" htmlFor="dr-c"><DateRangePicker id="dr-c" defaultValue={{ from: "2026-10-20", to: "2026-10-26" }} today={HOY} /></Field>
          <Field label="Vacío" htmlFor="dr-v"><DateRangePicker id="dr-v" today={HOY} /></Field>
          <Field label="Con error" htmlFor="dr-e" error="La fecha final debe ser posterior a la inicial."><DateRangePicker id="dr-e" defaultValue={{ from: "2026-10-26", to: "2026-10-20" }} aria-describedby="dr-e-error" today={HOY} /></Field>
          <Field label="Sin atajos, un mes" htmlFor="dr-s"><DateRangePicker id="dr-s" presets={false} months={1} today={HOY} /></Field>
          <Field label="Hasta hoy (reportes)" htmlFor="dr-m"><DateRangePicker id="dr-m" max={HOY} today={HOY} /></Field>
          <Field label="Desactivado" htmlFor="dr-d"><DateRangePicker id="dr-d" defaultValue={{ from: "2026-10-20", to: "2026-10-26" }} disabled /></Field>
        </div>
      </Specimen>
      <Specimen title="Controlado" note="value / onValueChange con cadenas ISO.">
        <FechasControlado />
      </Specimen>
      <Specimen title="Envío en FormData" note="Lo que recibiría una server action: cadena ISO o vacío.">
        <FechasForm />
      </Specimen>
      <Specimen title="Dentro de un diálogo" note="El calendario queda por encima del diálogo (--z-popup).">
        <FechasDialogo />
      </Specimen>
      <Specimen title="En una barra de filtros" note="Slot extra de ListToolbar.">
        <FechasBarra />
      </Specimen>
    </>
  );
}
