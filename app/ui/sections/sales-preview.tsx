import { SalesPreview } from "@/components/ui/sales-preview";
import { Specimen } from "../gallery";

export function SalesPreviewSection() {
  return (
    <>
      <Specimen title="Activo">
        <SalesPreview category="Viandas" name="Ñame" description="Por libra. Ñame amarillo de temporada." />
      </Specimen>
      <Specimen title="Pausado">
        <SalesPreview category="Viandas" name="Ñame" description="Por libra." paused />
      </Specimen>
    </>
  );
}
