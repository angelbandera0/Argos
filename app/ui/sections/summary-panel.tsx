import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Checklist, SummaryCard, SummaryPanel } from "@/components/ui/summary-panel";
import { Specimen } from "../gallery";

export function SummaryPanelSection() {
  return (
    <>
      <Specimen title="Panel de resumen con lista de comprobación" note="En páginas va como `aside` de FormShell (sticky, 340 px).">
        <div style={{ maxWidth: "340px" }}>
          <SummaryPanel
            icon="KeyRound"
            title="Almacenero"
            placeholder="Sin nombre"
            subtitle="Sesión: tope de la compañía"
            actions={
              <>
                <Button size="lg">Guardar rol</Button>
                <Button size="lg" variant="secondary">
                  Cancelar
                </Button>
              </>
            }
          >
            <SummaryCard
              rows={[
                { label: "Compañías", value: [<Chip key="a">La Nacion</Chip>, <Chip key="b">La Casona</Chip>] },
                { label: "Productos", value: "Ver · Crear · Editar" },
              ]}
            />
            <Checklist
              items={[
                { state: "ok", label: "Nombre de al menos 3 letras" },
                { state: "todo", label: "Al menos una compañía" },
                { state: "warn", label: "Sin permisos: solo podrá iniciar sesión" },
              ]}
            />
          </SummaryPanel>
        </div>
      </Specimen>
      <Specimen title="Sin nombre">
        <div style={{ maxWidth: "340px" }}>
          <SummaryPanel icon="KeyRound" title="" placeholder="Sin nombre" />
        </div>
      </Specimen>
    </>
  );
}
