"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import {
  createUserAction,
  type NewUserState,
} from "@/app/(app)/usuarios/actions";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { Multiselect } from "@/components/ui/multiselect";
import { Select } from "@/components/ui/select";
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
  const [state, action, pending] = useActionState<NewUserState, FormData>(
    createUserAction,
    {},
  );
  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));
  const storeOptions = stores.map((s) => ({
    value: s.id,
    label: `${s.name} · ${s.site}`,
  }));

  return (
    <>
      <FormShell
        action={action}
        error={state.error}
        pending={pending}
        submitLabel="Crear usuario"
        pendingLabel="Creando…"
      >
        <Card>
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
          <Field
            label="Nombre de usuario"
            htmlFor="name"
            hint="Con este nombre entrará con su PIN. El prefijo es fijo."
          >
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
            <Select
              id="roleId"
              name="roleId"
              required
              options={roleOptions}
              defaultValue={roles[0]?.id}
            />
          </Field>
          <Field label="Tiendas" htmlFor="storeId">
            <Multiselect
              id="storeId"
              name="storeId"
              options={storeOptions}
              placeholder="Elige una o varias tiendas"
            />
          </Field>
        </Card>
      </FormShell>
      {state.pin && state.userId && (
        <PinRevealDialog
          name={state.displayName ?? "el usuario"}
          pin={state.pin}
          onDone={() => router.push(`/usuarios/${state.userId}`)}
        />
      )}
    </>
  );
}
