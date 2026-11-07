"use client";

import { Input } from "./input";
import { Select, type SelectOption } from "./select";

export type QuantityPickerProps = {
  id: string;
  name: string;
  unitName: string;
  value: string;
  unit: string;
  units: SelectOption[];
  /** Line under the field, e.g. "= 125,000 lb". */
  equivalent?: string;
  error?: string;
  onValueChange: (value: string) => void;
  onUnitChange: (unit: string) => void;
};

/** Quantity + unit selector (§6.43), desktop variant. */
export function QuantityPicker({ id, name, unitName, value, unit, units, equivalent, error, onValueChange, onUnitChange }: QuantityPickerProps) {
  return (
    <div className="ui-quantity-picker stack">
      <div className="row">
        <Input id={id} name={name} type="number" inputMode="decimal" min={0} step="any" required value={value} onChange={(e) => onValueChange(e.target.value)} aria-invalid={error ? true : undefined} aria-label="Cantidad" />
        <Select name={unitName} aria-label="Unidad" options={units} value={unit} onValueChange={(v) => onUnitChange(v ?? "")} invalid={!!error} />
      </div>
      {(error || equivalent) && <p className={error ? "error-text" : "hint"}>{error ?? equivalent}</p>}
    </div>
  );
}
