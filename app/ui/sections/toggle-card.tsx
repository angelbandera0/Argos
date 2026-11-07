"use client";

import { useState } from "react";
import { ShoppingCart } from "@/components/icons";
import { ToggleCard } from "@/components/ui/toggle-card";
import { Specimen } from "../gallery";

export function ToggleCardSection() {
  const [on, setOn] = useState(true);
  const [costs, setCosts] = useState(true);
  return (
    <>
    <Specimen title="Activo / inactivo">
      <ToggleCard checked={on} onCheckedChange={setOn} icon={<ShoppingCart />} title="Activo" description="Se ofrece en ventas desde que lo guardes" />
    </Specimen>
    <Specimen title="Delicada («Ver costos»)">
      <ToggleCard tone="delicate" checked={costs} onCheckedChange={setCosts} icon={<ShoppingCart />} title="Ver costos" description="Muestra costos y valores" />
    </Specimen>
    <Specimen title="Bloqueada (candado)">
      <ToggleCard locked disabled checked onCheckedChange={() => {}} icon={<ShoppingCart />} title="Activa" description="No se puede desactivar" />
    </Specimen>
    </>
  );
}
