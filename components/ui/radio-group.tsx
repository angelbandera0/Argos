"use client";

import { useId } from "react";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";

export type RadioOption = { value: string; label: string; disabled?: boolean };

export function RadioGroup({
  legend,
  options,
  ...props
}: Omit<BaseRadioGroup.Props, "children" | "aria-labelledby"> & { legend: string; options: RadioOption[] }) {
  const legendId = useId();
  return (
    <fieldset className="ui-fieldset">
      <legend id={legendId}>{legend}</legend>
      <BaseRadioGroup aria-labelledby={legendId} className="ui-radio-group" {...props}>
        {options.map((o) => (
          <label key={o.value} className="ui-choice" data-disabled={o.disabled || props.disabled || undefined}>
            <Radio.Root value={o.value} disabled={o.disabled} className="ui-radio">
              <Radio.Indicator className="ui-radio-dot" />
            </Radio.Root>
            <span className="ui-choice-text">{o.label}</span>
          </label>
        ))}
      </BaseRadioGroup>
    </fieldset>
  );
}
