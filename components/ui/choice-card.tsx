"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { useId } from "react";
import { CheckboxBox } from "./checkbox";

export function choiceCardClass({ checked, row }: { checked?: boolean; row?: boolean }) {
  return ["ui-choice-card", row && "ui-choice-card-row", checked && "ui-choice-card-on"].filter(Boolean).join(" ");
}

/** Selectable card with a trailing checkbox; `row` = full-width "select all" bar. Supports `indeterminate`. */
export function ChoiceCard({
  avatar,
  title,
  description,
  row,
  checked,
  indeterminate,
  onCheckedChange,
}: {
  avatar?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  row?: boolean;
  checked: boolean;
  indeterminate?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label className={choiceCardClass({ checked: checked && !row, row })}>
      {row && <CheckboxBox checked={checked} indeterminate={indeterminate} onCheckedChange={onCheckedChange} aria-label={String(title)} />}
      {avatar}
      <span className="ui-choice-card-text">
        <strong>{title}</strong>
        {description && <span className="hint">{description}</span>}
      </span>
      {!row && <CheckboxBox checked={checked} onCheckedChange={onCheckedChange} aria-label={String(title)} />}
    </label>
  );
}

export type PillOption = { value: string; label: string; badge?: string };

/** 2–6 short options as pills (radio). */
export function ChoicePills({
  legend,
  options,
  value,
  onValueChange,
  describedBy,
}: {
  legend: string;
  options: PillOption[];
  value: string;
  onValueChange: (value: string) => void;
  describedBy?: string;
}) {
  const id = useId();
  return (
    <div className="field">
      <span id={id} className="ui-pills-legend">
        {legend}
      </span>
      <RadioGroup aria-labelledby={id} aria-describedby={describedBy} className="ui-pills" value={value} onValueChange={onValueChange}>
        {options.map((o) => (
          <label key={o.value} className="ui-pill" data-on={o.value === value || undefined}>
            <Radio.Root value={o.value} className="ui-radio">
              <Radio.Indicator className="ui-radio-dot" />
            </Radio.Root>
            {o.label}
            {o.badge && <span className="ui-pill-badge">{o.badge}</span>}
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}
