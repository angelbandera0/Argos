"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = { value: string; label: string; disabled?: boolean; hint?: string };

export function Select({
  options,
  placeholder = "Elige una opción",
  invalid,
  id,
  className,
  "aria-describedby": describedBy,
  "aria-label": ariaLabel,
  ...root
}: Omit<BaseSelect.Root.Props<string>, "items" | "children" | "multiple"> & {
  options: SelectOption[];
  placeholder?: string;
  invalid?: boolean;
  className?: string;
  "aria-describedby"?: string;
  "aria-label"?: string;
}) {
  return (
    <BaseSelect.Root items={options} {...root}>
      <BaseSelect.Trigger
        id={id}
        className={`ui-control ui-trigger${className ? ` ${className}` : ""}`}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        aria-label={ariaLabel}
      >
        <BaseSelect.Value className="ui-value" placeholder={placeholder} />
        <BaseSelect.Icon className="ui-chevron">
          <ChevronDown aria-hidden="true" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner className="ui-positioner" sideOffset={8} alignItemWithTrigger={false}>
          <BaseSelect.Popup className="ui-popup">
            <BaseSelect.List className="ui-list">
              {options.map((o) => (
                <BaseSelect.Item key={o.value} value={o.value} disabled={o.disabled} className="ui-option">
                  <BaseSelect.ItemText className="ui-option-label">{o.label}</BaseSelect.ItemText>
                  {o.hint && <span className="ui-option-hint">{o.hint}</span>}
                  <BaseSelect.ItemIndicator className="ui-option-check">
                    <Check aria-hidden="true" />
                  </BaseSelect.ItemIndicator>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
