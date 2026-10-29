"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { ChoiceCard, ChoicePills } from "@/components/ui/choice-card";
import { Specimen } from "../gallery";

export function ChoiceCardSection() {
  const [on, setOn] = useState<string[]>(["a"]);
  const [session, setSession] = useState("");
  const all = on.length === 2;
  const set = (id: string, c: boolean) => setOn((p) => (c ? [...p, id] : p.filter((x) => x !== id)));
  return (
    <>
      <Specimen title="Tarjetas seleccionables con fila «todas» (mixta)">
        <div className="stack">
          <ChoiceCard row title="Todas mis compañías" checked={all} indeterminate={on.length === 1} onCheckedChange={(c) => setOn(c ? ["a", "b"] : [])} />
          <div className="ui-company-grid">
            <ChoiceCard avatar={<Avatar name="La Nacion" size="md" />} title="La Nacion" description="717d" checked={on.includes("a")} onCheckedChange={(c) => set("a", c)} />
            <ChoiceCard avatar={<Avatar name="La Casona" size="md" />} title="La Casona" description="qbt6" checked={on.includes("b")} onCheckedChange={(c) => set("b", c)} />
          </div>
        </div>
      </Specimen>
      <Specimen title="Radio en píldoras (2–6 opciones)">
        <ChoicePills
          legend="Tiempo de sesión"
          value={session}
          onValueChange={setSession}
          options={[{ value: "", label: "Tope de la compañía", badge: "Recomendado" }, { value: "4", label: "4 h" }, { value: "8", label: "8 h" }]}
        />
      </Specimen>
    </>
  );
}
