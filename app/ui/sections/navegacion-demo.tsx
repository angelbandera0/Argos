"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Steps } from "@/components/ui/steps";

const steps = [
  { title: "Productos", description: "Elige qué vendes", content: <p className="muted">Aquí va el contenido del paso actual.</p> },
  { title: "Cliente", description: "Datos opcionales", content: <p className="muted">Busca o crea un cliente.</p> },
  { title: "Pago", description: "Cobra la venta", content: <p className="muted">Selecciona el método de pago.</p> },
  { title: "Resumen", description: "Revisa y termina", content: <p className="muted">Confirma los datos.</p> },
];

export function StepsDemo({ orientation }: { orientation: "horizontal" | "vertical" }) {
  const [current, setCurrent] = useState(1);
  const [error, setError] = useState(false);
  return (
    <div className="ui-panel ui-stack">
      <Steps steps={steps} current={current} errorIndex={error ? current : undefined} orientation={orientation} />
      <div className="ui-row">
        <Button variant="secondary" disabled={current === 0} onClick={() => setCurrent(current - 1)}>Atrás</Button>
        <Button disabled={current === steps.length - 1} onClick={() => (setError(false), setCurrent(current + 1))}>
          {current === steps.length - 2 ? "Finalizar" : "Siguiente"}
        </Button>
        <Button variant="outline" onClick={() => setError(!error)}>{error ? "Quitar error" : "Marcar error en el actual"}</Button>
      </div>
    </div>
  );
}
