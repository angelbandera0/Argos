"use client";

import { useState, useTransition } from "react";
import { saveAssignmentsAction } from "@/app/(app)/usuarios/actions";
import { AlertCircle, Check, Info, Lock } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";

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
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const chosen = stores.filter((s) => sel[s.id] !== null);

  function save() {
    setError(undefined);
    setSaved(false);
    start(async () => {
      const r = await saveAssignmentsAction(
        userId,
        chosen.map((s) => ({ storeId: s.id, roleId: same ? shared : (sel[s.id] as string) })),
      );
      if (r.error) setError(r.error);
      else setSaved(true);
    });
  }

  return (
    <div className="stack">
      {blocked && (
        <div className="notice" id="assign-blocked">
          <Info aria-hidden="true" />
          <p>
            Este usuario tiene tiendas con un rol de otro administrador. Solo su dueño puede cambiar las asignaciones;
            tú puedes desbloquear, cambiar el PIN o desactivar al usuario.
          </p>
        </div>
      )}
      <label className="list-row switch-row inner">
        <input
          className="switch"
          type="checkbox"
          role="switch"
          checked={same}
          disabled={blocked}
          onChange={(e) => setSame(e.target.checked)}
        />
        <span>
          <strong>Mismo rol en todas las tiendas</strong>
          <br />
          <span className="caption">Desactívalo para dar un rol distinto en cada tienda.</span>
        </span>
      </label>
      {same && (
        <div className="field">
          <label htmlFor="shared-role">Rol</label>
          <select className="select" id="shared-role" value={shared} disabled={blocked} onChange={(e) => setShared(e.target.value)}>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <ul className="list" aria-label="Tiendas de la compañía">
        {stores.map((s) => {
          const foreign = foreignStoreIds.includes(s.id);
          const on = sel[s.id] !== null;
          return (
            <li className="list-row assign-row" key={s.id}>
              <label className="perm">
                <input
                  type="checkbox"
                  checked={on}
                  disabled={blocked}
                  onChange={(e) => setSel({ ...sel, [s.id]: e.target.checked ? shared || firstRole : null })}
                />
                <span>
                  <strong>{s.name}</strong>
                  <br />
                  <span className="caption">Sede {s.site}</span>
                </span>
              </label>
              {foreign ? (
                <Chip variant="ring">
                  <Lock aria-hidden="true" />
                  Rol de otro administrador
                </Chip>
              ) : on && !same ? (
                <>
                  <label className="sr-only" htmlFor={`role-${s.id}`}>
                    Rol en {s.name}
                  </label>
                  <select
                    className="select"
                    id={`role-${s.id}`}
                    value={sel[s.id] ?? ""}
                    disabled={blocked}
                    onChange={(e) => setSel({ ...sel, [s.id]: e.target.value })}
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <span />
              )}
              {s.active ? <Chip variant="ring">Activa</Chip> : <Chip variant="alert">Desactivada</Chip>}
            </li>
          );
        })}
      </ul>
      {error && (
        <p className="form-error" role="alert">
          <AlertCircle aria-hidden="true" />
          {error}
        </p>
      )}
      {saved && (
        <p className="caption" role="status">
          <Check aria-hidden="true" /> Cambios guardados.
        </p>
      )}
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
