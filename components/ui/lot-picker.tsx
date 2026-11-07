"use client";

import { useState } from "react";
import { Button } from "./button";
import { Input } from "./input";
import { allocated, isBalanced, isSuggested, setLotQty, suggestedAllocation, type Allocation, type Lot } from "./lot-logic";
import { formatQty, type BaseUnit } from "./quantity-logic";

export function LotPicker({
  lots,
  needed,
  unit,
  value,
  onChange,
  reason,
  onReasonChange,
  showCosts = false,
}: {
  lots: Lot[];
  needed: number;
  unit: BaseUnit;
  value: Allocation;
  onChange: (value: Allocation) => void;
  reason: string;
  onReasonChange: (value: string) => void;
  showCosts?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const suggested = () => onChange(suggestedAllocation(lots, needed));
  if (!open) {
    return (
      <div className="ui-lot-closed">
        <span>Sale de {lots[0]?.code} (el más antiguo primero)</span>
        <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
          Elegir lote
        </Button>
      </div>
    );
  }
  const balanced = isBalanced(value, needed);
  const deviates = !isSuggested(value, lots, needed);
  return (
    <div className="ui-lot">
      <ul className="ui-lot-list">
        {lots.map((lot, i) => {
          const qty = value[lot.id] ?? 0;
          return (
            <li key={lot.id} className={`ui-lot-row${qty > 0 ? " is-used" : ""}`}>
              <div className="ui-lot-info">
                <span className="ui-lot-code">{lot.code}</span>
                {i === 0 && <span className="ui-lot-chip">Sugerido · más antiguo</span>}
                <div className="ui-lot-meta">
                  {lot.meta} · quedan {formatQty(lot.remaining, unit)}
                  {showCosts && lot.cost && ` · ${lot.cost}`}
                </div>
              </div>
              <Input
                type="number"
                min={0}
                className="ui-lot-qty"
                aria-label={`Cantidad del lote ${lot.code}`}
                value={qty}
                onChange={(e) => onChange(setLotQty(value, lots, needed, lot.id, Number(e.target.value)))}
              />
            </li>
          );
        })}
      </ul>
      <p className={`ui-lot-total${balanced ? " is-ok" : " is-bad"}`} role="status">
        Repartido {formatQty(allocated(value), unit)} de {formatQty(needed, unit)}
      </p>
      {deviates && (
        <div className="ui-lot-warn">
          <strong>No sale del lote más antiguo</strong>
          <Input variant="outline" aria-label="Motivo (opcional)" placeholder="Motivo (opcional)" value={reason} onChange={(e) => onReasonChange(e.target.value)} />
          <Button variant="ghost" size="sm" onClick={suggested}>
            Usar el sugerido
          </Button>
        </div>
      )}
    </div>
  );
}
