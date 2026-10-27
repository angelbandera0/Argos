"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";

export function Switch({
  label,
  description,
  className,
  ...props
}: Omit<BaseSwitch.Root.Props, "children"> & { label: React.ReactNode; description?: React.ReactNode }) {
  return (
    <label className={`ui-choice ui-switch-row${className ? ` ${className}` : ""}`} data-disabled={props.disabled || undefined}>
      <BaseSwitch.Root className="ui-switch" {...props}>
        <BaseSwitch.Thumb className="ui-switch-thumb" />
      </BaseSwitch.Root>
      <span className="ui-choice-text">
        {label}
        {description && <span className="hint">{description}</span>}
      </span>
    </label>
  );
}
