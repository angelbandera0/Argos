"use client";

import { Lock } from "lucide-react";

export function ToggleCard({
  checked,
  onCheckedChange,
  icon,
  title,
  description,
  disabled,
  tone = "good",
  locked,
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "onChange" | "title"> & {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  tone?: "good" | "delicate";
  locked?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      data-tone={tone}
      className={`ui-toggle-card${className ? ` ${className}` : ""}`}
      onClick={() => onCheckedChange(!checked)}
      {...props}
    >
      <span className="ui-toggle-card-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="ui-toggle-card-text">
        <strong>{title}</strong>
        {description && <span className="hint">{description}</span>}
      </span>
      {locked && <Lock className="ui-toggle-card-lock" aria-label="Bloqueado" />}
      <span className="ui-switch" data-checked={checked || undefined} aria-hidden="true">
        <span className="ui-switch-thumb" data-checked={checked || undefined} />
      </span>
    </button>
  );
}
