import { SpendSummary } from "@/components/ui/spend-summary";
import { Specimen } from "../gallery";

const CUP = { code: "CUP", decimals: 2 };
const PRODUCTS = [
  { name: "Arroz", amount: 9000 },
  { name: "Aceite", amount: 5200 },
  { name: "Pan", amount: 2400 },
];

export function SpendSummarySection() {
  return (
    <>
      <Specimen title="Sobrante positivo, con gasto por producto">
        <SpendSummary delivered={20000} spent={16600} currency={CUP} products={PRODUCTS} />
      </Specimen>
      <Specimen title="Excedido">
        <SpendSummary delivered={8000} spent={8450} currency={CUP} />
      </Specimen>
      <Specimen title="hideAmounts" note="No renderiza nada (sin permiso «Ver costos»).">
        <SpendSummary delivered={8000} spent={8450} currency={CUP} hideAmounts />
        <p>(vacío)</p>
      </Specimen>
    </>
  );
}
