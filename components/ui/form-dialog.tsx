"use client";

import { useActionState } from "react";
import { Button } from "./button";
import { Dialog } from "./dialog";
import { FormShell } from "./form-shell";
import { useToast } from "./toast";

export type FormDialogState = { error?: string; nameError?: string };

export function FormDialog<S extends FormDialogState>({
  title,
  description,
  action,
  initial = {} as S,
  successMessage,
  size,
  onClose,
  children,
}: {
  title: string;
  description?: string;
  action: (prev: S, formData: FormData) => Promise<S>;
  initial?: S;
  successMessage?: string;
  size?: "sm" | "md" | "lg";
  onClose: () => void;
  children: (state: S) => React.ReactNode;
}) {
  const toast = useToast();
  const [state, formAction, pending] = useActionState<S, FormData>(
    async (prev, formData) => {
      const next = await action(prev, formData);
      if (!next.error && !next.nameError) {
        if (successMessage) toast.success(successMessage);
        onClose();
      }
      return next as Awaited<S>;
    },
    initial as Awaited<S>,
  );

  return (
    <Dialog
      open
      title={title}
      description={description}
      size={size}
      onClose={onClose}
    >
      <FormShell
        action={formAction}
        error={state.error}
        pending={pending}
        cancel={
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        }
      >
        {children(state)}
      </FormShell>
    </Dialog>
  );
}
