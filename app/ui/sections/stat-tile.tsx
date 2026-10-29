import { StatTile } from "@/components/ui/stat-tile";
import { Specimen } from "../gallery";

export function StatTileSection() {
  return (
    <Specimen title="Indicadores">
      <div className="ui-stat-grid">
        <StatTile icon="Building2" label="Sedes" value={3} />
        <StatTile icon="Box" label="Tiendas" value={12} />
      </div>
    </Specimen>
  );
}
