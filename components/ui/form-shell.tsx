"use client";

import { useFormStatus } from "react-dom";
import { AlertCircle } from "@/components/icons";
import { Button } from "./button";

export function FormSubmit({
  label,
  pendingLabel = "Guardando…",
  pending: external,
  disabled,
  size,
}: {
  label: string;
  pendingLabel?: string;
  pending?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const status = useFormStatus();
  const pending = status.pending || external;
  return (
    <Button type="submit" size={size} loading={pending} disabled={disabled}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

export function FormShell({
  error,
  submitLabel = "Guardar",
  pendingLabel = "Guardando…",
  pending,
  cancel,
  aside,
  children,
  ...form
}: Omit<React.ComponentProps<"form">, "children"> & {
  error?: string;
  submitLabel?: string;
  pendingLabel?: string;
  pending?: boolean;
  cancel?: React.ReactNode;
  /** Wide layout (§6.38): form column + side summary panel, which carries its own actions. */
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  const errorBox = error && (
    <p className="form-error" role="alert">
      <AlertCircle aria-hidden="true" />
      {error}
    </p>
  );
  if (aside)
    return (
      <form className="form-shell form-shell-wide" {...form}>
        <div className="form-shell-main">
          {children}
          {errorBox}
        </div>
        {aside}
      </form>
    );
  return (
    <form className="form-shell" {...form}>
      {children}
      {errorBox}
      <div className="form-shell-actions">
        {cancel}
        <FormSubmit label={submitLabel} pendingLabel={pendingLabel} pending={pending} />
      </div>
    </form>
  );
}
