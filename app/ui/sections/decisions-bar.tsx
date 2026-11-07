"use client";

import { useState } from "react";
import { DecisionsBar } from "@/components/ui/decisions-bar";
import { Specimen } from "../gallery";

const INITIAL = { transfers: 3, purchases: 1, rejections: 1 };

export function DecisionsBarSection() {
  const [d, setD] = useState(INITIAL);
  return (
    <Specimen title="Con decisiones" note="Sticky abajo; en móvil, barra oscura compacta (excepción del módulo 2). Deshacer todo la vacía.">
      <DecisionsBar decisions={d} onUndo={() => setD({ transfers: 0, purchases: 0, rejections: 0 })} onApply={() => setD(INITIAL)} />
      {d.transfers + d.purchases + d.rejections === 0 && <p>(sin decisiones: no se muestra)</p>}
    </Specimen>
  );
}
