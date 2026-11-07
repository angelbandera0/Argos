import { Badge } from "./badge";
import { coverage, coverageLabel } from "./coverage-logic";
import type { BaseUnit } from "./quantity-logic";

export function StockCoverage({ stock, needed, unit }: { stock: number; needed: number; unit: BaseUnit }) {
  const c = coverage(stock, needed);
  const variant = c.state === "full" ? "success" : c.state === "part" ? "warning" : "danger";
  return (
    <div className="ui-stock-coverage">
      <Badge variant={variant}>{coverageLabel(c, stock, unit)}</Badge>
      <div
        className="ui-stock-coverage-bar"
        data-state={c.state}
        role="meter"
        aria-label="Cobertura de stock"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(c.ratio * 100)}
      >
        <span style={{ width: `${c.ratio * 100}%` }} />
      </div>
    </div>
  );
}
