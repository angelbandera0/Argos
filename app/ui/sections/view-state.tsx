import { Button } from "@/components/ui/button";
import { ViewState } from "@/components/ui/view-state";
import { Specimen } from "../gallery";

export function ViewStateSection() {
  return (
    <>
      <Specimen title="Cargando · filas"><ViewState kind="loading" entity="Existencias" /></Specimen>
      <Specimen title="Cargando · tarjetas"><ViewState kind="loading" entity="Pedidos" shape="cards" count={3} /></Specimen>
      <Specimen title="Vacío con permiso de crear">
        <ViewState kind="empty" entity="Productos" title="Aún no hay productos en el almacén" text="Registra las existencias que ya tienes para empezar." action={<Button>Registrar entrada inicial</Button>} />
      </Specimen>
      <Specimen title="Vacío sin permiso de crear" note="Mismo mensaje, sin botón.">
        <ViewState kind="empty" entity="Productos" canCreate={false} action={<Button>Registrar entrada inicial</Button>} />
      </Specimen>
      <Specimen title="Sin coincidencias">
        <ViewState kind="no-match" entity="Productos" title="Ningún producto coincide con «aceitunas»" action={<Button variant="secondary">Limpiar filtros</Button>} />
      </Specimen>
      <Specimen title="Error">
        <ViewState kind="error" entity="Existencias" action={<Button variant="secondary">Reintentar</Button>} supportCode="EXS-503" supportTime="15:42" />
      </Specimen>
      <Specimen title="Sin permiso">
        <ViewState kind="forbidden" entity="Existencias" permission="Existencias · Ver" action={<Button variant="secondary">Volver al inicio</Button>} />
      </Specimen>
    </>
  );
}
