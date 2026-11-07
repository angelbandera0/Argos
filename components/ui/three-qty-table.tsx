"use client";

import { Badge } from "./badge";
import { diffOf, type Unit } from "./diff-logic";
import { Input } from "./input";

export type ThreeQtyRow = {
  id: string;
  name: string;
  unit: Unit;
  ordered: number;
  reported: number;
  received: number;
  notBought?: boolean;
  cost?: string;
};

export function ThreeQtyTable({
  rows,
  onReceivedChange,
  showCosts,
}: {
  rows: ThreeQtyRow[];
  onReceivedChange?: (id: string, received: number) => void;
  showCosts?: boolean;
}) {
  return (
    <table className="ui-three-qty">
      <thead>
        <tr>
          <th scope="col">Producto</th>
          <th scope="col">Pedida</th>
          <th scope="col">Reportada</th>
          <th scope="col">Recibida</th>
          <th scope="col">Diferencia</th>
          {showCosts && <th scope="col">Costo</th>}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => {
          const d = diffOf(r.received, r.reported, r.unit, r.notBought);
          return (
            <tr key={r.id} data-diff={d.kind === "diff" || undefined}>
              <th scope="row">{r.name}</th>
              <td className="num">{r.ordered}</td>
              <td className="num">{r.reported}</td>
              <td className="num">
                {onReceivedChange ? (
                  <Input
                    type="number"
                    min={0}
                    className="ui-three-qty-input"
                    aria-label={`Recibida de ${r.name}`}
                    value={r.received}
                    onChange={(e) => onReceivedChange(r.id, Math.max(0, Number(e.target.value)))}
                  />
                ) : (
                  r.received
                )}
              </td>
              <td>
                <Badge variant={d.kind === "match" ? "success" : d.kind === "diff" ? "danger" : "neutral"} className={d.kind === "diff" ? "ui-three-qty-diff" : undefined}>
                  {d.label}
                </Badge>
              </td>
              {showCosts && <td className="num">{r.cost}</td>}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
