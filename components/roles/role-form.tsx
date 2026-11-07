"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { type RoleActionState, saveRoleAction } from "@/app/(app)/roles/actions";
import type { RoleInput } from "@/core/application/ports/role-repository";
import type { Module, PermissionSet, SpecialGrant } from "@/core/domain/permissions";
import { Alert } from "@/components/ui/alert";
import { avatarTone, companyInitials } from "@/components/org/company-avatar";
import { buttonClass } from "@/components/ui/button-class";
import { ChoiceCard, ChoicePills } from "@/components/ui/choice-card";
import { Chip } from "@/components/ui/chip";
import { Field, Input } from "@/components/ui/field";
import { FormSection } from "@/components/ui/form-section";
import { FormShell, FormSubmit } from "@/components/ui/form-shell";
import { Checklist, SummaryCard, SummaryPanel } from "@/components/ui/summary-panel";
import { PermissionMatrix } from "./permission-matrix";
import { SpecialPermissions } from "./module-permissions";
import { abilities, checklist, hasAnyPermission, nameError, OPS, pruneSpecials, SESSION_HOURS, sessionSummary } from "./role-form-logic";

export function RoleForm({
  roleId,
  initial,
  companies,
}: {
  roleId: string | null;
  initial: Omit<RoleInput, "ownerId" | "permissions" | "specialPermissions"> & {
    permissions: Record<Module, PermissionSet>;
    specialPermissions: SpecialGrant[];
  };
  companies: { id: string; name: string; code: string }[];
}) {
  const [state, action, pending] = useActionState<RoleActionState, FormData>(saveRoleAction.bind(null, roleId), {});
  const [name, setName] = useState(initial.name);
  const [touched, setTouched] = useState(false);
  const [hours, setHours] = useState(initial.sessionSeconds ? String(initial.sessionSeconds / 3600) : "");
  const [on, setOn] = useState(() => new Set(companies.filter((c) => !initial.excludedCompanyIds.includes(c.id)).map((c) => c.id)));
  const [permissions, setPermissions] = useState(initial.permissions);
  const [grants, setGrants] = useState(initial.specialPermissions);
  const changePermissions = (next: Record<Module, PermissionSet>) => {
    setPermissions(next);
    setGrants(pruneSpecials(next, grants));
  };
  const hourList = hours && !SESSION_HOURS.includes(Number(hours)) ? [...SESSION_HOURS, Number(hours)].sort((a, b) => a - b) : SESSION_HOURS;
  const sessions = [
    { value: "", label: "Tope de la compañía", badge: "Recomendado" },
    ...hourList.map((h) => ({ value: String(h), label: `${h} h` })),
  ];
  const { items, complete } = checklist(name, on.size, hasAnyPermission(permissions, grants));
  const nameMsg = touched ? nameError(name) : undefined;
  const noCompany = touched && on.size === 0;
  const chosen = companies.filter((c) => on.has(c.id));
  const toggleCompany = (id: string, checked: boolean) => {
    const next = new Set(on);
    if (checked) next.add(id);
    else next.delete(id);
    setOn(next);
  };

  return (
    <FormShell
      action={action}
      error={state.error}
      onSubmit={(e) => {
        if (!complete) {
          e.preventDefault();
          setTouched(true);
        }
      }}
      aside={
        <SummaryPanel
          icon="KeyRound"
          title={name.trim()}
          placeholder="Sin nombre"
          subtitle={sessionSummary(hours)}
          actions={
            <>
              <FormSubmit label="Guardar rol" size="lg" pending={pending} disabled={!complete} />
              <Link className={buttonClass("secondary", "lg")} href="/roles">
                Cancelar
              </Link>
            </>
          }
        >
          <SummaryCard
            rows={[
              {
                label: "Compañías",
                value: chosen.length ? chosen.map((c) => <Chip key={c.id}>{c.name}</Chip>) : "Ninguna",
              },
              ...abilities(permissions, grants).map((a) => ({ label: a.label, value: a.text })),
            ]}
          />
          {grants.some((g) => g.permission === "see_costs") && (
            <Alert variant="danger" title="Verá costos e importes.">
              Incluye el valor del inventario, los montos de los pedidos y el costo de cada lote.
            </Alert>
          )}
          <Checklist items={items} />
        </SummaryPanel>
      }
    >
      <input type="hidden" name="hours" value={hours} />
      {chosen.map((c) => (
        <input key={c.id} type="hidden" name="company" value={c.id} />
      ))}
      {(Object.keys(permissions) as Module[]).flatMap((m) =>
        OPS.filter(({ op }) => permissions[m][op]).map(({ op }) => <input key={`${m}.${op}`} type="hidden" name={`${m}.${op}`} value="on" />),
      )}
      {grants.map((g) => (
        <input key={g.permission} type="hidden" name={`special.${g.permission}`} value={g.warehouse ? "warehouse" : "on"} />
      ))}

      <FormSection n={1} title="Datos del rol" description="Cómo se llama y cuánto dura la sesión.">
        <Field label="Nombre" htmlFor="name" hint="Así aparece al asignarlo a un usuario." error={state.nameError ?? nameMsg}>
          <Input
            id="name"
            name="name"
            maxLength={80}
            autoComplete="off"
            placeholder="Ej. Cajero, Almacenero"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            aria-describedby={`name-hint${state.nameError || nameMsg ? " name-error" : ""}`}
            aria-invalid={state.nameError || nameMsg ? true : undefined}
          />
        </Field>
        <ChoicePills legend="Tiempo de sesión" options={sessions} value={hours} onValueChange={setHours} describedBy="hours-hint" />
        <span className="hint" id="hours-hint">
          Nunca supera el tope de la compañía de la tienda donde se trabaja (máximo 24 horas).
        </span>
      </FormSection>

      <FormSection
        n={2}
        title="Compañías donde vale"
        description="Por defecto vale para todas tus compañías. Desmarca las que no lo necesiten."
        aside={
          <Chip variant={noCompany ? "danger" : undefined}>
            {on.size} de {companies.length}
          </Chip>
        }
      >
        <ChoiceCard
          row
          title="Todas mis compañías"
          checked={on.size === companies.length}
          indeterminate={on.size > 0 && on.size < companies.length}
          onCheckedChange={(c) => setOn(c ? new Set(companies.map((x) => x.id)) : new Set())}
        />
        <div className="ui-company-grid" role="group" aria-label="Compañías">
          {companies.map((c) => (
            <ChoiceCard
              key={c.id}
              avatar={<span className={`ui-avatar ui-avatar-md co-tone-${avatarTone(c.code)}`} aria-hidden="true">{companyInitials(c.name)}</span>}
              title={c.name}
              description={c.code}
              checked={on.has(c.id)}
              onCheckedChange={(checked) => toggleCompany(c.id, checked)}
            />
          ))}
        </div>
        {noCompany && (
          <p className="error-text" role="alert">
            Elige al menos una compañía.
          </p>
        )}
      </FormSection>

      <FormSection n={3} title="Permisos por módulo" description="Marca lo que este rol puede hacer en cada módulo.">
        <PermissionMatrix value={permissions} onChange={changePermissions} />
      </FormSection>

      <FormSection n={4} title="Permisos especiales" description="Acciones delicadas de cada módulo; requieren «Ver» en ese módulo.">
        <SpecialPermissions permissions={permissions} grants={grants} onGrants={setGrants} />
      </FormSection>
    </FormShell>
  );
}
