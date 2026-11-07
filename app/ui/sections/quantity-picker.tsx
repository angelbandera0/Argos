"use client";

import { useState } from "react";
import { QuantityPicker } from "@/components/ui/quantity-picker";
import { Specimen } from "../gallery";

const units = [
  { value: "base", label: "lb" },
  { value: "Saco de 25 lb", label: "Saco de 25 lb" },
];

export function QuantityPickerSection() {
  const [value, setValue] = useState("5");
  const [unit, setUnit] = useState("Saco de 25 lb");
  return (
    <>
      <Specimen title="Por defecto">
        <QuantityPicker id="qp-1" name="qty" unitName="unit" value={value} unit={unit} units={units} equivalent="= 125,000 lb" onValueChange={setValue} onUnitChange={setUnit} />
      </Specimen>
      <Specimen title="Con error">
        <QuantityPicker id="qp-2" name="qty2" unitName="unit2" value="500" unit="base" units={units} error="Solo hay 125,000 lb" onValueChange={() => {}} onUnitChange={() => {}} />
      </Specimen>
    </>
  );
}
