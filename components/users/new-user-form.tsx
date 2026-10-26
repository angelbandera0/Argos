"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import { createUserAction, type NewUserState } from "@/app/(app)/usuarios/actions";
import { AlertCircle } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { PinRevealDialog } from "./pin-reveal-dialog";

export function NewUserForm({
  code,
  roles,
  stores,
}: {
  code: string;
  roles: { id: string; name: string }[];
  stores: { id: string; name: string; site: string }[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState<NewUserState, FormData>(createUserAction, {});
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [chosen, setChosen] = useState<string[]>([]);

  return (
    <Card>
      <form className="auth-form" action={action}>
        <Field label="Nombre" htmlFor="displayName">
          <Input id="displayName" name="displayName" autoComplete="off" required maxLength={80} defaultValue={state.displayName} />
        </Field>
        <Field label="Nombre de usuario" htmlFor="name" hint="Con este nombre entrará con su PIN. El prefijo es fijo.">
          <div className="prefix">
            <span className="mono">{code}.</span>
            <Input
              id="name"
              name="name"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              required
              minLength={2}
              maxLength={24}
              pattern="[a-z0-9_\-]{2,24}"
              defaultValue={state.name}
              aria-describedby="name-hint"
            />
          </div>
        </Field>
        <Field label="Rol" htmlFor="roleId">
          <select className="select" id="roleId" name="roleId" required value={roleId} onChange={(e) => setRoleId(e.target.value)}>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
        <fieldset className="stack">
          <legend className="h2">Tiendas</legend>
          <div className="perm-grid">
            {stores.map((s) => (
              <label className="perm" key={s.id}>
                <input
                  type="checkbox"
                  name="storeId"
                  value={s.id}
                  checked={chosen.includes(s.id)}
                  onChange={(e) => setChosen(e.target.checked ? [...chosen, s.id] : chosen.filter((i) => i !== s.id))}
                />
                {s.name} <span className="caption">· {s.site}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {state.error && (
          <p className="form-error" role="alert">
            <AlertCircle aria-hidden="true" />
            {state.error}
          </p>
        )}
        <Button type="submit" loading={pending}>
          {pending ? "Creando…" : "Crear usuario"}
        </Button>
      </form>
      {state.pin && state.userId && (
        <PinRevealDialog
          name={state.displayName ?? "el usuario"}
          pin={state.pin}
          onDone={() => router.push(`/usuarios/${state.userId}`)}
        />
      )}
    </Card>
  );
}
