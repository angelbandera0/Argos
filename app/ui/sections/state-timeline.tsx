import { StateTimeline, type TimelineStep } from "@/components/ui/state-timeline";
import { Specimen } from "../gallery";

const STEPS: TimelineStep[] = [
  { title: "Creado", state: "done", meta: "Admin · 3 nov, 09:10" },
  { title: "En curso", state: "now", meta: "Comprador · 4 nov, 08:00" },
  { title: "En revisión", state: "upcoming" },
  { title: "Cumplido", state: "upcoming" },
];

const DETAIL: TimelineStep[] = [
  { title: "Creado", state: "done", meta: "Admin · 3 nov, 09:10" },
  { title: "En revisión", state: "done", meta: "Comprador · 4 nov, 17:30" },
  { title: "Devuelto", state: "returned", meta: "Almacenero · 5 nov, 10:02", note: "Faltan 2 sacos de arroz." },
  { title: "Cumplido", state: "upcoming" },
];

export function StateTimelineSection() {
  return (
    <>
      <Specimen title="Horizontal (cabeceras)">
        <StateTimeline steps={STEPS} />
      </Specimen>
      <Specimen title="Vertical (detalle) con nota">
        <StateTimeline steps={DETAIL} orientation="vertical" />
      </Specimen>
      <Specimen title="Confirmado">
        <StateTimeline steps={[{ title: "Revisado", state: "confirmed", meta: "Almacenero · 6 nov" }]} />
      </Specimen>
    </>
  );
}
