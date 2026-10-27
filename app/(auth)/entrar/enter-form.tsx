"use client";

import { useActionState, useState } from "react";
import { ForgotPin } from "@/components/auth/forgot-pin";
import { PinField } from "@/components/auth/pin-field";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { enterWithPin, type EnterState } from "./actions";

export function EnterForm() {
  const [state, action, pending] = useActionState<EnterState, FormData>(enterWithPin, {});
  const [username, setUsername] = useState("");
  const [pinLength, setPinLength] = useState(0);
  const [dismissed, setDismissed] = useState<EnterState | null>(null);
  const error = state.error && dismissed !== state ? state.error : undefined;
  return (
    <form className="auth-form" action={action}>
      <Field label="Usuario" htmlFor="username">
        <Input
          id="username"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setDismissed(state);
          }}
          aria-invalid={error ? true : undefined}
        />
      </Field>
      <PinField
        name="pin"
        label="PIN"
        error={error}
        onValueChange={(v) => {
          setPinLength(v.length);
          setDismissed(state);
        }}
      />
      <Button type="submit" className="pin-submit" disabled={!username.trim() || pinLength !== 6} loading={pending}>
        {pending ? "Entrando…" : "Entrar"}
      </Button>
      <ForgotPin />
    </form>
  );
}
