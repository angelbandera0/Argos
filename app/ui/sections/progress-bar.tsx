import { Button } from "@/components/ui/button";
import { LoadingStatus } from "@/components/ui/loading-status";
import { ProgressBar } from "@/components/ui/progress-bar";
import { SkeletonRows } from "@/components/ui/skeleton-rows";
import { Specimen } from "../gallery";

export function ProgressBarSection() {
  return (
    <>
      <Specimen title="ProgressBar" note="Solo para operaciones con progreso medible.">
        <ProgressBar value={64} label="Sincronizando ventas" />
      </Specimen>
      <Specimen title="LoadingStatus" note="Carga de una región.">
        <LoadingStatus>Cargando pedidos…</LoadingStatus>
      </Specimen>
      <Specimen title="SkeletonRows" note="Listas y tablas.">
        <SkeletonRows count={2} />
      </Specimen>
      <Specimen title="Button loading + loadingLabel" note="Mantiene el ancho; texto «Guardando…».">
        <Button loading loadingLabel="Guardando…">Guardar</Button>
      </Specimen>
    </>
  );
}
