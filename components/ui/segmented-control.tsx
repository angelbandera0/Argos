"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";

export type SegmentedOption = { value: string; label: string; disabled?: boolean };

export function SegmentedControl({
  options,
  "aria-label": ariaLabel,
  ...props
}: Omit<RadioGroup.Props, "children" | "aria-label" | "className"> & { options: SegmentedOption[]; "aria-label": string }) {
  return (
    <RadioGroup aria-label={ariaLabel} className="ui-segmented" {...props}>
      {options.map((o) => (
        <Radio.Root key={o.value} value={o.value} disabled={o.disabled} className="ui-segmented-item">
          {o.label}
        </Radio.Root>
      ))}
    </RadioGroup>
  );
}
