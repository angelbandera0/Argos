"use client";

import { useState } from "react";
import { Select as BaseSelect } from "@base-ui/react/select";
import { Check } from "lucide-react";
import { FilterPill } from "./filter-pill";
import type { SelectOption } from "./select";

type Common = {
  label: string;
  options: SelectOption[];
  emptyText?: string;
  /** Single mode only: node before the label (e.g. an Avatar) for the chosen value. */
  leading?: (value: string) => React.ReactNode;
};

export type FilterSelectProps = Common &
  ({ multiple: true; value: string[]; onValueChange: (v: string[]) => void } | { multiple?: false; value: string; onValueChange: (v: string) => void });

/** `Select` (single, with a «all» option) or `Select multiple` hosted in a FilterPill. */
export function FilterSelect(props: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const { label, options, emptyText = "Todos" } = props;
  const values = props.multiple ? props.value : props.value ? [props.value] : [];
  const names = values.map((v) => options.find((o) => o.value === v)?.label ?? v);
  const valueText = names.length === 0 ? undefined : names.length === 1 ? names[0] : `${names[0]} +${names.length - 1}`;
  const items = props.multiple ? options : [{ value: "", label: emptyText }, ...options];

  const pill = (
    <FilterPill
      label={label}
      valueText={valueText}
      emptyText={emptyText}
      open={open}
      leading={!props.multiple && props.value ? props.leading?.(props.value) : undefined}
      onClear={() => (props.multiple ? props.onValueChange([]) : props.onValueChange(""))}
      trigger={(content, className) => <BaseSelect.Trigger className={className}>{content}</BaseSelect.Trigger>}
    />
  );
  const popup = (
    <BaseSelect.Portal>
      <BaseSelect.Positioner className="ui-positioner" sideOffset={8} alignItemWithTrigger={false} align="start">
        <BaseSelect.Popup className="ui-popup">
          <BaseSelect.List className="ui-list" aria-label={label}>
            {items.map((o) => (
              <BaseSelect.Item key={o.value} value={o.value} disabled={o.disabled} className="ui-option">
                <BaseSelect.ItemText className="ui-option-label">{o.label}</BaseSelect.ItemText>
                <BaseSelect.ItemIndicator className="ui-option-check">
                  <Check aria-hidden="true" />
                </BaseSelect.ItemIndicator>
              </BaseSelect.Item>
            ))}
          </BaseSelect.List>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );

  return props.multiple ? (
    <BaseSelect.Root multiple items={items} value={props.value} onValueChange={props.onValueChange} open={open} onOpenChange={setOpen}>
      {pill}
      {popup}
    </BaseSelect.Root>
  ) : (
    <BaseSelect.Root items={items} value={props.value} onValueChange={(v) => props.onValueChange(v ?? "")} open={open} onOpenChange={setOpen}>
      {pill}
      {popup}
    </BaseSelect.Root>
  );
}
