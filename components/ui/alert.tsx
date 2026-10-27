"use client";

import { useState } from "react";
import { NAV_ICONS, type NavIconName } from "@/components/icons";
import { alertRole, TONE_ICON, type Tone } from "./feedback-utils";

export function Alert({
  variant = "info",
  title,
  icon,
  action,
  dismissible,
  onDismiss,
  compact,
  className,
  children,
}: {
  variant?: Tone;
  title?: string;
  icon?: NavIconName;
  action?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  compact?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;
  const Icon = NAV_ICONS[icon ?? TONE_ICON[variant]];
  const cls = `alert tone-${variant}${compact ? " alert-compact" : ""}${className ? ` ${className}` : ""}`;
  return (
    <div role={alertRole(variant)} className={cls}>
      {compact ? (
        <span className="alert-dot" aria-hidden="true" />
      ) : (
        <span className="icon-circle" aria-hidden="true">
          <Icon />
        </span>
      )}
      <div className="alert-text">
        {title && <p className="alert-title">{title}</p>}
        {children && <div className="alert-body">{children}</div>}
        {action && <div className="alert-action">{action}</div>}
      </div>
      {dismissible && !compact && (
        <button
          type="button"
          className="close-btn"
          aria-label="Cerrar aviso"
          onClick={() => {
            setHidden(true);
            onDismiss?.();
          }}
        >
          <NAV_ICONS.X aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
