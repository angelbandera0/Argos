"use client";

import { useState } from "react";
import { StoreSplit } from "@/components/ui/store-split";
import { Specimen } from "../gallery";

const STORES = [{ id: "a", name: "Centro" }, { id: "b", name: "Vedado" }];

export function StoreSplitSection() {
  const [ok, setOk] = useState<Record<string, number>>({ a: 1, b: 1 });
  const [bad, setBad] = useState<Record<string, number>>({ a: 1, b: 0 });
  return (
    <>
      <Specimen title="Cuadra"><StoreSplit stores={STORES} total={2} values={ok} onValuesChange={setOk} /></Specimen>
      <Specimen title="No cuadra"><StoreSplit stores={STORES} total={2} values={bad} onValuesChange={setBad} /></Specimen>
    </>
  );
}
