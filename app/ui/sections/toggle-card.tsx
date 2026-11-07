"use client";

import { useState } from "react";
import { ShoppingCart } from "@/components/icons";
import { ToggleCard } from "@/components/ui/toggle-card";
import { Specimen } from "../gallery";

export function ToggleCardSection() {
  const [on, setOn] = useState(true);
  return (
    <Specimen title="Activo / inactivo">
      <ToggleCard checked={on} onCheckedChange={setOn} icon={<ShoppingCart />} title="Activo" description="Se ofrece en ventas desde que lo guardes" />
    </Specimen>
  );
}
