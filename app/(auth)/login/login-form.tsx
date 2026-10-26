"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { signInAdmin, type FormState } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signInAdmin, {});
  return (
    <form className="auth-form" action={action}>
      <Field label="Correo" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          defaultValue={state.email}
          aria-invalid={state.error ? true : undefined}
        />
      </Field>
      <Field label="Contraseña" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state.error ? true : undefined}
        />
      </Field>
      {state.error && <Alert variant="danger">{state.error}</Alert>}
      <Button type="submit" loading={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>
      <div className="auth-actions">
        <Link href="/recuperar">¿Olvidaste tu contraseña?</Link>
      </div>
    </form>
  );
}
