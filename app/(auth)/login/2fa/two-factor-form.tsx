"use client";

import { useActionState, useState } from "react";
import { AlertCircle } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { CodeField } from "@/components/ui/code-field";
import { signOutAdmin, verifyTotp, type FormState } from "../../actions";

export function TwoFactorForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(verifyTotp, {});
  const [code, setCode] = useState("");
  return (
    <>
      <form className="auth-form" action={action}>
        <CodeField id="code" name="code" label="Código de verificación" error={!!state.error} onValueChange={setCode} />
        {state.error && (
          <p className="form-error" role="alert">
            <AlertCircle aria-hidden="true" />
            {state.error}
          </p>
        )}
        <Button type="submit" loading={pending} disabled={code.length < 6}>
          {pending ? "Verificando…" : "Verificar"}
        </Button>
      </form>
      <form className="auth-actions" action={signOutAdmin}>
        <Button type="submit" variant="ghost">
          Usar otra cuenta
        </Button>
      </form>
    </>
  );
}
