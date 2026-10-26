"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { type RoleActionState, saveRoleAction } from "@/app/(app)/roles/actions";
import type { Role } from "@/core/application/ports/role-repository";
import { Alert } from "@/components/ui/alert";
import { buttonClass } from "@/components/ui/button-class";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Field, Input } from "@/components/ui/field";
import { FormShell } from "@/components/ui/form-shell";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PermissionMatrix } from "./permission-matrix";

const HOURS = [8, 4, 2, 1];

export function RoleForm({
  roleId,
  initial,
  companies,
}: {
  roleId: string | null;
  initial: Omit<Role, "id" | "ownerId">;
  companies: { id: string; name: string; code: string }[];
}) {
  const [state, action, pending] = useActionState<RoleActionState, FormData>(saveRoleAction.bind(null, roleId), {});
  const [name, setName] = useState(initial.name);
  const [hours, setHours] = useState(initial.sessionSeconds ? String(initial.sessionSeconds / 3600) : "");
  const [on, setOn] = useState(() => new Set(companies.filter((c) => !initial.excludedCompanyIds.includes(c.id)).map((c) => c.id)));
  const [permissions, setPermissions] = useState(initial.permissions);
  const hourList = hours && !HOURS.includes(Number(hours)) ? [...HOURS, Number(hours)] : HOURS;
  const options = hourList.map((h) => ({ value: String(h), label: h === 1 ? "1 hora" : `${h} horas` }));

  return (
    <FormShell
      action={action}
      error={state.error}
      pending={pending}
      submitLabel="Guardar rol"
      cancel={
        <Link className={buttonClass("secondary", "md")} href="/roles">
          Cancelar
        </Link>
      }
    >
      <Card aria-labelledby="h-datos">
        <h2 className="h2" id="h-datos">
          Datos del rol
        </h2>
        <Field label="Nombre" htmlFor="name" error={state.nameError}>
          <Input
            id="name"
            name="name"
            required
            maxLength={80}
            autoComplete="off"
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-describedby={state.nameError ? "name-error" : undefined}
            aria-invalid={state.nameError ? true : undefined}
          />
        </Field>
        <Field
          label="Tiempo de sesión"
          htmlFor="hours"
          hint="Nunca supera el tope de la compañía de la tienda donde se trabaja (máximo 24 horas)."
        >
          <input type="hidden" name="hours" value={hours} />
          <Select
            id="hours"
            options={options}
            placeholder="Usar el tope de la compañía"
            value={hours || null}
            onValueChange={(v) => setHours(v ?? "")}
            aria-describedby="hours-hint"
          />
        </Field>
      </Card>

      <Card aria-labelledby="h-comp">
        <div className="card-head">
          <h2 className="h2" id="h-comp">
            Compañías donde vale
          </h2>
          <span className="spacer" />
          <Chip>
            {on.size} de {companies.length}
          </Chip>
        </div>
        <p className="hint">Por defecto un rol vale para todas tus compañías. Desmarca las que no lo necesiten.</p>
        <div className="stack" role="group" aria-label="Compañías">
          {companies.map((c) => (
            <Switch
              key={c.id}
              name="company"
              value={c.id}
              label={c.name}
              description={<span className="mono">{c.code}</span>}
              checked={on.has(c.id)}
              onCheckedChange={(checked) => {
                const next = new Set(on);
                if (checked) next.add(c.id);
                else next.delete(c.id);
                setOn(next);
              }}
            />
          ))}
        </div>
      </Card>

      <Card aria-labelledby="h-perm">
        <h2 className="h2" id="h-perm">
          Permisos por módulo
        </h2>
        <PermissionMatrix value={permissions} onChange={setPermissions} />
        <Alert variant="info" compact>
          Compañías, sedes, tiendas, usuarios, roles y categorías solo los gestionan los administradores, por eso no aparecen aquí.
        </Alert>
      </Card>

    </FormShell>
  );
}
