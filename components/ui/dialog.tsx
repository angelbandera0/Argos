"use client";

import { useLayoutEffect } from "react";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { NAV_ICONS, type NavIconName } from "@/components/icons";

type Size = "sm" | "md" | "lg";
type DialogTone = "warning" | "danger";

export type DialogShellProps = {
  title: string;
  description?: string;
  icon?: NavIconName;
  tone?: DialogTone;
  size?: Size;
  footer?: React.ReactNode;
  showClose?: boolean;
  initialFocus?: React.RefObject<HTMLElement | null>;
  children?: React.ReactNode;
};

export function DialogShell({
  title,
  description,
  icon,
  tone = "warning",
  size = "md",
  footer,
  showClose,
  initialFocus,
  children,
}: DialogShellProps) {
  const Icon = icon && NAV_ICONS[icon];
  return (
    <BaseDialog.Portal>
      <BaseDialog.Backdrop className="dialog-backdrop" />
      <BaseDialog.Viewport className="dialog-viewport">
        <BaseDialog.Popup className={`dialog-popup dialog-${size}`} initialFocus={initialFocus}>
          <div className="modal-body">
            {Icon && (
              <span className={`dialog-icon dialog-icon-${tone}`} aria-hidden="true">
                <Icon />
              </span>
            )}
            <div className="dialog-head">
              <BaseDialog.Title className="h2 dialog-title">{title}</BaseDialog.Title>
              {showClose && (
                <BaseDialog.Close className="close-btn close-btn-panel" aria-label="Cerrar">
                  <NAV_ICONS.X aria-hidden="true" />
                </BaseDialog.Close>
              )}
            </div>
            {description && <BaseDialog.Description className="dialog-desc">{description}</BaseDialog.Description>}
            {children}
          </div>
          {footer && <div className="dialog-footer">{footer}</div>}
        </BaseDialog.Popup>
      </BaseDialog.Viewport>
    </BaseDialog.Portal>
  );
}

export function Dialog({
  open,
  onClose,
  dismissible = true,
  showClose,
  ...shell
}: DialogShellProps & {
  open: boolean;
  onClose?: () => void;
  dismissible?: boolean;
}) {
  useLayoutEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    return () => opener?.focus();
  }, [open]);

  return (
    <BaseDialog.Root
      open={open}
      disablePointerDismissal
      onOpenChange={(next, details) => {
        if (next) return;
        if (!dismissible) details.cancel();
        else onClose?.();
      }}
    >
      <DialogShell showClose={showClose && dismissible} {...shell} />
    </BaseDialog.Root>
  );
}
