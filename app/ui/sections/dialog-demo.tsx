"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

export function DialogDemo() {
  const [mode, setMode] = useState<"normal" | "locked" | null>(null);
  const close = () => setMode(null);
  return (
    <>
      <div className="ui-row">
        <Button variant="secondary" onClick={() => setMode("normal")}>
          Abrir diálogo
        </Button>
        <Button variant="secondary" onClick={() => setMode("locked")}>
          Abrir diálogo no descartable
        </Button>
      </div>
      <Dialog open={mode !== null} title="Título del diálogo" dismissible={mode !== "locked"} onClose={close}>
        <p>{mode === "locked" ? "Escape no lo cierra; usa el botón." : "Escape o el botón lo cierran."}</p>
        <div className="modal-actions">
          <Button variant="secondary" onClick={close}>
            Cancelar
          </Button>
          <Button onClick={close}>Aceptar</Button>
        </div>
      </Dialog>
    </>
  );
}
