import { MoneyValue } from "@/components/ui/money-value";
import { Specimen } from "../gallery";

const CUP = { code: "CUP", decimals: 2 };

export function MoneyValueSection() {
  return (
    <>
      <Specimen title="Formato de divisa"><MoneyValue value={12500} currency={CUP} /></Specimen>
      <Specimen title="Con signo"><MoneyValue value={3400} currency={CUP} signed /> <MoneyValue value={-450} currency={CUP} signed /></Specimen>
      <Specimen title="Sin costo conocido" note="Chip con contorno, nunca 0,00."><MoneyValue value={null} currency={CUP} /></Specimen>
      <Specimen title="Variante sin costos (costs=false)" note="No renderiza nada: ni 0 ni hueco."><MoneyValue value={12500} currency={CUP} costs={false} /><p>(vacío)</p></Specimen>
    </>
  );
}
