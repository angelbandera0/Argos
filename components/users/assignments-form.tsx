"use client";

import { useState, useTransition } from "react";
import { saveAssignmentsAction } from "@/app/(app)/usuarios/actions";
import { Lock } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Chip } from "@/components/ui/chip";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";

interface StoreRow {
  id: string;
  name: string;
  site: string;
  active: boolean;
}

export function AssignmentsForm({
  userId,
  stores,
  roles,
  initial,
  foreignStoreIds,
}: {
  userId: string;
  stores: StoreRow[];
  roles: { id: string; name: string }[];
  initial: { storeId: string; roleId: string }[];
  foreignStoreIds: string[];
}) {
  const blocked = foreignStoreIds.length > 0;
  const firstRole = roles[0]?.id ?? "";
  const [sel, setSel] = useState<Record<string, string | null>>(
    Object.fromEntries(stores.map((s) => [s.id, initial.find((a) => a.storeId === s.id)?.roleId ?? null])),
  );
  const assignedRoles = new Set(initial.map((a) => a.roleId));
  const [same, setSame] = useState(assignedRoles.size <= 1);
  const [shared, setShared] = useState(initial[0]?.roleId ?? firstRole);
  const [error, setError] = useState<string>();
  const toast = useToast();
  const roleOptions = roles.map((r) => ({ value: r.id, label: r.name }));
  const [pending, start] = useTransition();
  const chosen = stores.filter((s) => sel[s.id] !== null);

  function save() {
    setError(undefined);
    start(async () => {
      const r = await saveAssignmentsAction(
        userId,
        chosen.map((s) => ({ storeId: s.id, roleId: same ? shared : (sel[s.id] as string) })),
      );
      if (r.error) setError(r.error);
      else toast.success("Cambios guardados.");
    });
  }

  return (
    <div className="stack">
      {blocked && (
        <Alert variant="info">
          <span id="assign-blocked">
            Este usuario tiene tiendas con un rol de otro administrador. Solo su dueño puede cambiar las asignaciones;
            tú puedes desbloquear, cambiar el PIN o desactivar al usuario.
          </span>
        </Alert>
      )}
      <Switch
        className="inner"
        label="Mismo rol en todas las tiendas"
        description="Desactívalo para dar un rol distinto en cada tienda."
        checked={same}
        disabled={blocked}
        onCheckedChange={setSame}
      />
      {same && (
        <Field label="Rol" htmlFor="shared-role">
          <Select
            id="shared-role"
            options={roleOptions}
            value={shared}
            disabled={blocked}
            onValueChange={(v) => v && setShared(v)}
          />
        </Field>
      )}
      <ul className="list" aria-label="Tiendas de la compañía">
        {stores.map((s) => {
          const foreign = foreignStoreIds.includes(s.id);
          const on = sel[s.id] !== null;
          return (
            <li className="list-row assign-row" key={s.id}>
              <Checkbox
                label={s.name}
                description={`Sede ${s.site}`}
                checked={on}
                disabled={blocked}
                onCheckedChange={(checked) => setSel({ ...sel, [s.id]: checked ? shared || firstRole : null })}
              />
              {foreign ? (
                <Chip variant="ring">
                  <Lock aria-hidden="true" />
                  Rol de otro administrador
                </Chip>
              ) : on && !same ? (
                <>
                  <Select
                    id={`role-${s.id}`}
                    aria-label={`Rol en ${s.name}`}
                    options={roleOptions}
                    value={sel[s.id] ?? ""}
                    disabled={blocked}
                    onValueChange={(v) => v && setSel({ ...sel, [s.id]: v })}
                  />
                </>
              ) : (
                <span />
              )}
              {s.active ? <Chip variant="ring">Activa</Chip> : <Chip variant="alert">Desactivada</Chip>}
            </li>
          );
        })}
      </ul>
      {error && <Alert variant="danger">{error}</Alert>}
      <div className="form-actions">
        <Button
          disabled={blocked || chosen.length === 0 || roles.length === 0}
          aria-describedby={blocked ? "assign-blocked" : undefined}
          loading={pending}
          onClick={save}
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </div>
  );
}
