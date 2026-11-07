"use client";

import { Badge } from "./badge";
import { Input } from "./input";
import { splitStatus } from "./split-logic";

export type SplitStore = { id: string; name: string };

export function StoreSplit({
  stores,
  total,
  values,
  onValuesChange,
}: {
  stores: SplitStore[];
  total: number;
  values: Record<string, number>;
  onValuesChange: (values: Record<string, number>) => void;
}) {
  const s = splitStatus(total, stores.map((st) => values[st.id] ?? 0));
  return (
    <div className="ui-store-split" role="group" aria-label="Repartir entre tiendas">
      <strong>Repartir entre tiendas</strong>
      {stores.map((st) => (
        <label key={st.id} className="ui-store-split-field">
          <span>{st.name}</span>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            className="ui-store-split-input"
            value={values[st.id] ?? 0}
            aria-invalid={!s.ok || undefined}
            onChange={(e) => onValuesChange({ ...values, [st.id]: Math.max(0, Number(e.target.value)) })}
          />
        </label>
      ))}
      <Badge variant={s.ok ? "success" : "danger"} role="status">
        {s.label}
      </Badge>
    </div>
  );
}
