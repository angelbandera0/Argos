"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { Check, Minus } from "lucide-react";

/** The box alone (no label): give it `aria-label`. */
export function CheckboxBox(props: Omit<BaseCheckbox.Root.Props, "children">) {
  return (
    <BaseCheckbox.Root className="ui-check" {...props}>
      <BaseCheckbox.Indicator className="ui-check-mark">
        {props.indeterminate ? <Minus aria-hidden="true" /> : <Check aria-hidden="true" />}
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}

export function Checkbox({
  label,
  description,
  className,
  ...props
}: Omit<BaseCheckbox.Root.Props, "children"> & { label: React.ReactNode; description?: React.ReactNode }) {
  return (
    <label className={`ui-choice${className ? ` ${className}` : ""}`} data-disabled={props.disabled || undefined}>
      <CheckboxBox {...props} />
      <span className="ui-choice-text">
        {label}
        {description && <span className="hint">{description}</span>}
      </span>
    </label>
  );
}
