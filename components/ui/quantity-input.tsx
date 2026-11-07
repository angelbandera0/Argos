"use client";

import { Minus, Plus } from "lucide-react";
import { Input } from "./input";
import { Select } from "./select";
import { equivalentLine, exceeds, toBase, type BaseUnit } from "./quantity-logic";

export type Presentation = { value: string; label: string; factor: number };

export function QuantityInput({
  value,
  onValueChange,
  presentations,
  presentation,
  onPresentationChange,
  unit,
  available,
  stepper,
  "aria-label": ariaLabel = "Cantidad",
}: {
  value: number;
  onValueChange: (value: number) => void;
  presentations: Presentation[];
  presentation: string;
  onPresentationChange: (value: string) => void;
  unit: BaseUnit;
  available?: number;
  stepper?: boolean;
  "aria-label"?: string;
}) {
  const factor = presentations.find((p) => p.value === presentation)?.factor ?? 1;
  const invalid = exceeds(toBase(value, factor, unit), available);
  const set = (n: number) => onValueChange(Math.max(0, n));
  return (
    <div className="ui-qty">
      <div className="ui-qty-row">
        {stepper ? (
          <div className="ui-qty-stepper">
            <button type="button" aria-label="Menos" disabled={value <= 0} onClick={() => set(value - 1)}>
              <Minus aria-hidden="true" />
            </button>
            <output aria-label={ariaLabel} aria-invalid={invalid || undefined}>{value}</output>
            <button type="button" aria-label="Más" onClick={() => set(value + 1)}>
              <Plus aria-hidden="true" />
            </button>
          </div>
        ) : (
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            className="ui-qty-field"
            aria-label={ariaLabel}
            aria-invalid={invalid || undefined}
            value={value}
            onChange={(e) => set(Number(e.target.value))}
          />
        )}
        <Select
          className="ui-qty-unit"
          aria-label="Unidad"
          options={presentations.map(({ value: v, label }) => ({ value: v, label }))}
          value={presentation}
          onValueChange={(v) => v && onPresentationChange(v)}
        />
      </div>
      <p className={`ui-qty-eq${invalid ? " is-error" : ""}`} role={invalid ? "alert" : undefined}>
        {equivalentLine(value, factor, unit, available)}
      </p>
    </div>
  );
}
