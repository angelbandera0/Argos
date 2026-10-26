"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { AlertCircle, Check, Copy, Info } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/field";
import { createAdminAction, type NewAdminState } from "../actions";

export function NewAdminForm() {
  const router = useRouter();
  const [state, action, pending] = useActionState<NewAdminState, FormData>(createAdminAction, {});
  const [copied, setCopied] = useState(false);
  const password = state.temporaryPassword;

  async function copy() {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      // Clipboard blocked: the password stays selectable in the dialog.
    }
  }

  return (
    <Card>
      <form className="auth-form" action={action}>
        <Field label="Nombre" htmlFor="displayName">
          <Input
            id="displayName"
            name="displayName"
            autoComplete="off"
            required
            maxLength={80}
            defaultValue={state.displayName}
          />
        </Field>
        <Field label="Correo" htmlFor="email" hint="Con este correo entrará a Argos.">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            required
            defaultValue={state.email}
            aria-describedby="email-hint"
            aria-invalid={state.error ? true : undefined}
          />
        </Field>
        {state.error && (
          <p className="form-error" role="alert">
            <AlertCircle aria-hidden="true" />
            {state.error}
          </p>
        )}
        <Button type="submit" loading={pending}>
          {pending ? "Creando…" : "Crear administrador"}
        </Button>
      </form>
      <Dialog open={!!password} title={`Contraseña temporal de ${state.displayName ?? ""}`} dismissible={false}>
        <p className="secret-reveal" aria-label="Contraseña temporal">
          {password}
        </p>
        <div className="notice">
          <Info aria-hidden="true" />
          <p>
            Cópiala ahora y entrégasela por un medio seguro. Por seguridad <strong>no volverá a mostrarse</strong>.
            Al entrar por primera vez deberá cambiarla y activar la verificación en dos pasos.
          </p>
        </div>
        <div className="modal-actions">
          <Button variant="secondary" onClick={copy}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copied ? "Contraseña copiada" : "Copiar contraseña"}
          </Button>
          <Button disabled={!copied} onClick={() => router.push("/superadmin/administradores")}>
            Ya la copié
          </Button>
        </div>
      </Dialog>
    </Card>
  );
}
