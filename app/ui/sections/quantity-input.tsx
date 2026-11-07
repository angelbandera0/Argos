"use client";

import { useState } from "react";
import { QuantityInput } from "@/components/ui/quantity-input";
import { Specimen } from "../gallery";

const PRESENTATIONS = [
  { value: "saco", label: "sacos de 25 lb", factor: 25 },
  { value: "bolsa", label: "bolsas de 5 lb", factor: 5 },
  { value: "lb", label: "lb", factor: 1 },
];

function Demo({ initial, stepper, available }: { initial: number; stepper?: boolean; available?: number }) {
  const [value, setValue] = useState(initial);
  const [presentation, setPresentation] = useState("saco");
  return (
    <QuantityInput
      value={value}
      onValueChange={setValue}
      presentations={PRESENTATIONS}
      presentation={presentation}
      onPresentationChange={setPresentation}
      unit="lb"
      available={available}
      stepper={stepper}
    />
  );
}

export function QuantityInputSection() {
  return (
    <>
      <Specimen title="Escritorio" note="5 sacos × 25 lb = 125,000 lb.">
        <Demo initial={5} />
      </Specimen>
      <Specimen title="Móvil · con botones">
        <Demo initial={5} stepper />
      </Specimen>
      <Specimen title="Supera lo disponible" note="Borde rojo y la línea dice cuánto hay.">
        <Demo initial={5} available={100} />
      </Specimen>
    </>
  );
}
