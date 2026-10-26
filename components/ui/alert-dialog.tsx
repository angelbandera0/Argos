"use client";

import { useRef } from "react";
import { AlertDialog as BaseAlertDialog } from "@base-ui/react/alert-dialog";
import { Button } from "./button";
import { DialogShell, type DialogShellProps } from "./dialog";

export function AlertDialog({
  open,
  onClose,
  onConfirm,
  confirmLabel,
  cancelLabel = "Cancelar",
  loading,
  dismissible = true,
  tone = "danger",
  size = "sm",
  icon = "Trash2",
  children,
  ...shell
}: Omit<DialogShellProps, "footer" | "showClose" | "initialFocus"> & {
  open: boolean;
  onClose?: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  dismissible?: boolean;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  return (
    <BaseAlertDialog.Root
      open={open}
      onOpenChange={(next, details) => {
        if (next) return;
        if (!dismissible || loading) details.cancel();
        else onClose?.();
      }}
    >
      <DialogShell
        {...shell}
        tone={tone}
        size={size}
        icon={icon}
        initialFocus={cancelRef}
        footer={
          <>
            <Button ref={cancelRef} variant="secondary" disabled={loading} onClick={onClose}>
              {cancelLabel}
            </Button>
            <Button variant={tone === "danger" ? "danger" : "primary"} loading={loading} onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </>
        }
      >
        {children}
      </DialogShell>
    </BaseAlertDialog.Root>
  );
}
