"use client";

import { useState } from "react";
import { LotPicker } from "@/components/ui/lot-picker";
import { suggestedAllocation, type Lot } from "@/components/ui/lot-logic";
import { Specimen } from "../gallery";

const LOTS: Lot[] = [
  { id: "a", code: "L-0017", meta: "28 oct · entrada inicial", remaining: 25, cost: "32,00 CUP/lb" },
  { id: "b", code: "L-0021", meta: "2 nov · compra", remaining: 40, cost: "34,00 CUP/lb" },
  { id: "c", code: "L-0024", meta: "5 nov · traslado", remaining: 60, cost: "35,00 CUP/lb" },
];

function Demo({ showCosts }: { showCosts?: boolean }) {
  const [value, setValue] = useState(() => suggestedAllocation(LOTS, 30));
  const [reason, setReason] = useState("");
  return <LotPicker lots={LOTS} needed={30} unit="lb" value={value} onChange={setValue} reason={reason} onReasonChange={setReason} showCosts={showCosts} />;
}

export function LotPickerSection() {
  return (
    <>
      <Specimen title="Cerrado → «Elegir lote»; abierto con reparto PEPS" note="Cambia la cantidad del primer lote para ver el aviso de lote no sugerido.">
        <Demo />
      </Specimen>
      <Specimen title="Con permiso «Ver costos» (showCosts)">
        <Demo showCosts />
      </Specimen>
    </>
  );
}
