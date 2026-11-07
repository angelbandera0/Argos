import { Badge } from "@/components/ui/badge";
import { EntityPanel } from "@/components/ui/entity-panel";
import { Specimen } from "../gallery";

const rows = [
  { id: "1", name: "Caja 1", meta: "Física", badge: <Badge variant="success">Activa</Badge> },
  { id: "2", name: "Caja 2", badge: <Badge variant="success">Activa</Badge> },
  { id: "3", name: "Online", badge: <Badge>Inactiva</Badge> },
];

export function EntityPanelSection() {
  return (
    <>
      <Specimen title="Con tiendas (muestra 2)">
        <EntityPanel title="Tiendas" rows={rows} empty="Esta sede aún no tiene tiendas." />
      </Specimen>
      <Specimen title="Vacío">
        <EntityPanel title="Tiendas" rows={[]} empty="Esta sede aún no tiene tiendas." />
      </Specimen>
    </>
  );
}
