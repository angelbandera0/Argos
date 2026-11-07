import { StockCoverage } from "@/components/ui/stock-coverage";
import { Specimen } from "../gallery";

export function StockCoverageSection() {
  return (
    <>
      <Specimen title="Cubre todo"><StockCoverage stock={20} needed={12} unit="lb" /></Specimen>
      <Specimen title="Cubre parte"><StockCoverage stock={8} needed={20} unit="lb" /></Specimen>
      <Specimen title="Sin existencia"><StockCoverage stock={0} needed={20} unit="lb" /></Specimen>
    </>
  );
}
