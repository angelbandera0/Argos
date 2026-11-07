"use client";

import { useState } from "react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Specimen } from "../gallery";

const OPTIONS = ["0", "2", "3"].map((v) => ({ value: v, label: v }));

export function SegmentedControlSection() {
  const [v, setV] = useState("2");
  return (
    <>
      <Specimen title="Decimales"><SegmentedControl aria-label="Decimales" options={OPTIONS} value={v} onValueChange={(x) => setV(String(x))} /></Specimen>
      <Specimen title="Opción deshabilitada"><SegmentedControl aria-label="Decimales" options={[...OPTIONS, { value: "4", label: "4", disabled: true }]} defaultValue="0" /></Specimen>
    </>
  );
}
