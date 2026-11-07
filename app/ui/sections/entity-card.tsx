"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EntityCard } from "@/components/ui/entity-card";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { Specimen } from "../gallery";

export function EntityCardSection() {
  return (
    <Specimen title="Activa, en uso">
      <div className="ui-entity-card-grid">
        <EntityCard
          avatar="LC"
          title={<a href="#">La Casona</a>}
          code="lacasona"
          chip={<Chip variant="warning">En uso</Chip>}
          badge={<Badge variant="success">Activa</Badge>}
          data={[
            { label: "Sedes", value: 3 },
            { label: "Tope de sesión", value: "8 h" },
          ]}
          actions={
            <>
              <Button variant="outline">Ver compañía</Button>
              <Button variant="outline" className="ui-entity-card-edit">
                Editar
              </Button>
            </>
          }
        />
        <EntityCard
          inactive
          avatar="PS"
          title={<a href="#">Panadería Sol</a>}
          code="panaderia-sol"
          badge={<Badge>Inactiva</Badge>}
          data={[{ label: "Sedes", value: 1 }]}
          actions={<Button variant="outline">Ver compañía</Button>}
        />
      </div>
    </Specimen>
  );
}

export function ViewToggleSection() {
  const [v, setV] = useState<ViewMode>("grilla");
  return (
    <Specimen title={`Vista: ${v}`}>
      <ViewToggle value={v} onValueChange={setV} />
    </Specimen>
  );
}
