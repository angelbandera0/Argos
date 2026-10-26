"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Check } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { requestPasswordReset, type FormState } from "../actions";

export function RecoverForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestPasswordReset, {});
  if (state.sent) {
    return (
      <div className="auth-form">
        <p className="form-error form-note" role="status">
          <Check aria-hidden="true" />
          Si el correo está registrado, te enviamos un enlace para restablecer la contraseña.
        </p>
        <Link href="/login">Volver a entrar</Link>
      </div>
    );
  }
  return (
    <form className="auth-form" action={action}>
      <Field label="Correo" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required />
      </Field>
      <Button type="submit" loading={pending}>
        {pending ? "Enviando…" : "Enviar enlace"}
      </Button>
      <div className="auth-actions">
        <Link href="/login">Volver a entrar</Link>
      </div>
    </form>
  );
}
