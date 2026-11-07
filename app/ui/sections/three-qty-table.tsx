"use client";

import { useState } from "react";
import { ThreeQtyTable, type ThreeQtyRow } from "@/components/ui/three-qty-table";
import { Specimen } from "../gallery";

const SACO = { one: "saco", many: "sacos" };
const ROWS: ThreeQtyRow[] = [
  { id: "1", name: "Arroz", unit: SACO, ordered: 10, reported: 10, received: 10, cost: "9.000,00 CUP" },
  { id: "2", name: "Frijol", unit: SACO, ordered: 5, reported: 5, received: 4, cost: "3.200,00 CUP" },
  { id: "3", name: "Aceite", unit: SACO, ordered: 2, reported: 0, received: 0, notBought: true, cost: "—" },
];

export function ThreeQtyTableSection() {
  const [rows, setRows] = useState(ROWS);
  return (
    <>
      <Specimen title="Revisión (Recibida editable), con costos">
        <ThreeQtyTable rows={rows} showCosts onReceivedChange={(id, v) => setRows((r) => r.map((x) => (x.id === id ? { ...x, received: v } : x)))} />
      </Specimen>
      <Specimen title="Detalle, sin costos">
        <ThreeQtyTable rows={ROWS} />
      </Specimen>
    </>
  );
}
