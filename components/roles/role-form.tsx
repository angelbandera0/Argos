"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { type RoleActionState, saveRoleAction } from "@/app/(app)/roles/actions";
import type { Role } from "@/core/application/ports/role-repository";
import { AlertCircle, Building2, Info } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { Field, Input } from "@/components/ui/field";
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
  const options = hours && !HOURS.includes(Number(hours)) ? [...HOURS, Number(hours)] : HOURS;

  return (
    <form className="stack" action={action}>
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
          <select
            className="select"
            id="hours"
            name="hours"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            aria-describedby="hours-hint"
          >
            <option value="">Usar el tope de la compañía</option>
            {options.map((h) => (
              <option key={h} value={h}>
                {h === 1 ? "1 hora" : `${h} horas`}
              </option>
            ))}
          </select>
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
        <div className="list" role="group" aria-label="Compañías">
          {companies.map((c) => (
            <label className="list-row switch-row" key={c.id}>
              <span className="icon-dot" aria-hidden="true">
                <Building2 />
              </span>
              <span>
                <strong>{c.name}</strong>
                <br />
                <span className="caption mono">{c.code}</span>
              </span>
              <input
                className="switch"
                type="checkbox"
                role="switch"
                name="company"
                value={c.id}
                checked={on.has(c.id)}
                onChange={(e) => {
                  const next = new Set(on);
                  if (e.target.checked) next.add(c.id);
                  else next.delete(c.id);
                  setOn(next);
                }}
              />
            </label>
          ))}
        </div>
      </Card>

      <Card aria-labelledby="h-perm">
        <h2 className="h2" id="h-perm">
          Permisos por módulo
        </h2>
        <PermissionMatrix value={permissions} onChange={setPermissions} />
        <div className="notice">
          <Info aria-hidden="true" />
          <p>Compañías, sedes, tiendas, usuarios, roles y categorías solo los gestionan los administradores, por eso no aparecen aquí.</p>
        </div>
      </Card>

      {state.error && (
        <p className="form-error" role="alert">
          <AlertCircle aria-hidden="true" />
          {state.error}
        </p>
      )}
      <div className="form-actions">
        <Button type="submit" loading={pending}>
          {pending ? "Guardando…" : "Guardar rol"}
        </Button>
        <Link className="btn btn-secondary" href="/roles">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
