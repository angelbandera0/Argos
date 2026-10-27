"use client";

import { useFormStatus } from "react-dom";
import { AlertCircle } from "@/components/icons";
import { Button } from "./button";

function Submit({ label, pendingLabel, pending: external }: { label: string; pendingLabel: string; pending?: boolean }) {
  const status = useFormStatus();
  const pending = status.pending || external;
  return (
    <Button type="submit" loading={pending}>
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
  children,
  ...form
}: Omit<React.ComponentProps<"form">, "children"> & {
  error?: string;
  submitLabel?: string;
  pendingLabel?: string;
  pending?: boolean;
  cancel?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <form className="form-shell" {...form}>
      {children}
      {error && (
        <p className="form-error" role="alert">
          <AlertCircle aria-hidden="true" />
          {error}
        </p>
      )}
      <div className="form-shell-actions">
        {cancel}
        <Submit label={submitLabel} pendingLabel={pendingLabel} pending={pending} />
      </div>
    </form>
  );
}
