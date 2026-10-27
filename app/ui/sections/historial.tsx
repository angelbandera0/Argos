import { AuditTable } from "@/components/ui/audit-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Specimen } from "../gallery";
import { AvataresDemo, FiltrosDemo, FiltrosEstados, HistorialCompleto, SAMPLE_GROUPS } from "./historial-demo";

export function FiltrosSection() {
  return (
    <>
      <Specimen title="Estados de FilterPill" note="Sin valor (borde ring), con valor (red-tint + ✕ «Quitar filtro X»), selección múltiple («+N») y rango de fechas. «Limpiar filtros» solo aparece con algún filtro activo.">
        <FiltrosEstados />
      </Specimen>
      <Specimen title="FilterBar interactiva" note="Select, Select múltiple y DateRangePicker en modo píldora. El halo rojo significa «abierto ahora».">
        <FiltrosDemo />
      </Specimen>
      <Specimen title="Avatar" note="Iniciales con tono determinista por nombre (misma paleta del selector de compañía); «Sistema» con engranaje.">
        <AvataresDemo />
      </Specimen>
    </>
  );
}

export function HistorialSection() {
  return (
    <>
      <Specimen title="AuditTable agrupada por día" note="Filas de grupo con contador, columna Módulo (solo en «Todos») y «Ver cambios» expandible Campo · Antes → Después. Horas en la zona del navegador.">
        <AuditTable label="Historial de ejemplo" groups={SAMPLE_GROUPS} showModule />
      </Specimen>
      <Specimen title="Cargando">
        <AuditTable label="Historial cargando" groups={[]} loading />
      </Specimen>
      <Specimen title="Vacía">
        <AuditTable label="Historial vacío" groups={[]} empty={<EmptyState icon="History" title="Aún no hay operaciones registradas." />} />
      </Specimen>
      <Specimen title="Sin coincidencias">
        <AuditTable
          label="Historial sin coincidencias"
          groups={[]}
          empty={<EmptyState icon="Search" title="Ninguna operación coincide con los filtros.">Prueba con otros filtros o límpialos.</EmptyState>}
        />
      </Specimen>
      <Specimen title="Página de historial completa (datos falsos)" note="Cabecera, tabs con contador, barra de filtros y tabla agrupada; los filtros actúan sobre los datos de ejemplo.">
        <HistorialCompleto />
      </Specimen>
    </>
  );
}
