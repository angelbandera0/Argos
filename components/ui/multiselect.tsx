"use client";

import { useState } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { Check, ChevronDown, X } from "lucide-react";
import { pickOptions, splitTags, type MultiselectOption } from "./multiselect-utils";

export type { MultiselectOption };

export function Multiselect({
  options,
  name,
  form,
  id,
  defaultValue = [],
  onValueChange,
  placeholder = "Elige una o varias",
  maxVisible = 3,
  disabled,
  invalid,
  className,
  "aria-describedby": describedBy,
}: {
  options: MultiselectOption[];
  name?: string;
  form?: string;
  id?: string;
  defaultValue?: string[];
  onValueChange?: (values: string[]) => void;
  placeholder?: string;
  maxVisible?: number;
  disabled?: boolean;
  invalid?: boolean;
  className?: string;
  "aria-describedby"?: string;
}) {
  const [values, setValues] = useState(defaultValue);
  const selected = pickOptions(options, values);
  const { visible, hidden } = splitTags(selected, maxVisible);
  return (
    <Combobox.Root
      multiple
      items={options}
      value={selected}
      disabled={disabled}
      itemToStringLabel={(o) => o.label}
      isItemEqualToValue={(a, b) => a.value === b.value}
      onValueChange={(next) => {
        const v = next.map((o) => o.value);
        setValues(v);
        onValueChange?.(v);
      }}
      onOpenChange={(open, details) => {
        if (!open && details.reason === "item-press") details.cancel();
      }}
    >
      {name && values.map((v) => <input key={v} type="hidden" name={name} value={v} form={form} />)}
      <Combobox.InputGroup
        className={`ui-control ui-multi${className ? ` ${className}` : ""}`}
        aria-invalid={invalid || undefined}
        data-invalid={invalid || undefined}
      >
        <Combobox.Chips className="ui-chips" aria-label={selected.length ? "Elegidos" : undefined}>
          {visible.map((o) => (
            <Combobox.Chip key={o.value} className="ui-tag" aria-label={o.label} aria-description="Pulsa Retroceso o Suprimir para quitar">
              {o.label}
              <Combobox.ChipRemove className="ui-tag-remove" aria-label={`Quitar ${o.label}`}>
                <X aria-hidden="true" />
              </Combobox.ChipRemove>
            </Combobox.Chip>
          ))}
          {hidden > 0 && <span className="ui-tag ui-tag-more">+{hidden}</span>}
          <Combobox.Input
            id={id}
            className="ui-multi-input"
            placeholder={selected.length ? "" : placeholder}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
          />
        </Combobox.Chips>
        {selected.length > 0 && (
          <Combobox.Clear className="ui-multi-btn" aria-label="Limpiar selección" title="Limpiar selección">
            <X aria-hidden="true" />
          </Combobox.Clear>
        )}
        <Combobox.Trigger className="ui-multi-btn ui-chevron" aria-label="Abrir lista" title="Abrir lista">
          <ChevronDown aria-hidden="true" />
        </Combobox.Trigger>
      </Combobox.InputGroup>
      <Combobox.Portal>
        <Combobox.Positioner className="ui-positioner" sideOffset={8}>
          <Combobox.Popup className="ui-popup">
            <Combobox.Empty className="ui-empty">Sin resultados</Combobox.Empty>
            <Combobox.List className="ui-list">
              {(o: MultiselectOption) => (
                <Combobox.Item key={o.value} value={o} disabled={o.disabled} className="ui-option">
                  <span className="ui-check" aria-hidden="true">
                    <Check />
                  </span>
                  <span className="ui-option-label">{o.label}</span>
                  {o.hint && <span className="ui-option-hint">{o.hint}</span>}
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  );
}
