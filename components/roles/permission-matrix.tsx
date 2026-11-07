"use client";

import type { Module, PermissionSet } from "@/core/domain/permissions";
import { Lock, NAV_ICONS } from "@/components/icons";
import { Chip } from "@/components/ui/chip";
import { CheckboxBox } from "@/components/ui/checkbox";
import {
  ADMIN_ONLY_MODULES,
  ALL_MODULES,
  allState,
  isViewLocked,
  matchTemplate,
  OPS,
  TEMPLATES,
  toggle,
  toggleAll,
  viewOnly,
} from "./role-form-logic";

type Value = Record<Module, PermissionSet>;

const PRODUCTS_HINT = "Eliminar no borra: el producto se marca como eliminado y queda en el historial. Con “Ver”, el rol también ve el historial de Productos.";

export function PermissionMatrix({ value, onChange }: { value: Value; onChange: (next: Value) => void }) {
  const current = matchTemplate(value.products);
  const anyLocked = ALL_MODULES.some((m) => isViewLocked(value[m.key]));
  const applyTemplate = (t: PermissionSet) =>
    onChange(Object.fromEntries(ALL_MODULES.map((m) => [m.key, viewOnly(m.key) ? { ...t, create: false, edit: false, delete: false } : t])) as Value);
  return (
    <>
      <div className="ui-perm-templates" role="group" aria-label="Plantillas de permisos">
        <span>Empezar desde:</span>
        {TEMPLATES.map((t) => (
          <Chip
            key={t.key}
            pressed={current === t.key}
            onPressedChange={() => applyTemplate(t.set)}
          >
            {t.label}
          </Chip>
        ))}
      </div>
      <table className="ui-perm-table">
        <thead>
          <tr>
            <th scope="col">Módulo</th>
            {OPS.map((o) => (
              <th scope="col" key={o.op}>
                {o.label}
              </th>
            ))}
            <th scope="col">Todo</th>
          </tr>
        </thead>
        <tbody>
          {ALL_MODULES.map(({ key, label, description, icon }) => {
            const p = value[key];
            const only = viewOnly(key);
            const Icon = NAV_ICONS[icon];
            const all = allState(p, only);
            return (
              <tr key={key}>
                <th scope="row">
                  <div className="ui-perm-module">
                    <span aria-hidden="true">
                      <Icon />
                    </span>
                    <div>
                      <strong>{label}</strong>
                      <span className="hint">{description}</span>
                    </div>
                  </div>
                </th>
                {OPS.map(({ op, label: l }) => {
                  const locked = op === "view" && isViewLocked(p);
                  const off = only && op !== "view";
                  return (
                    <td key={op}>
                      <CheckboxBox
                        checked={p[op]}
                        disabled={locked || off}
                        title={off ? "Este módulo solo permite ver" : locked ? "Necesario para crear, editar o eliminar" : undefined}
                        aria-label={`${l} ${label}`}
                        onCheckedChange={(on) => onChange({ ...value, [key]: toggle(p, op, on) })}
                      />
                    </td>
                  );
                })}
                <td>
                  <CheckboxBox
                    checked={all === "all"}
                    indeterminate={all === "some"}
                    aria-label={`Todos los permisos de ${label}`}
                    onCheckedChange={() => onChange({ ...value, [key]: toggleAll(p, only) })}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {anyLocked && <p className="hint">“Ver” queda marcado porque es necesario para crear, editar o eliminar.</p>}
      <p className="ui-perm-note">{PRODUCTS_HINT}</p>
      <p className="hint">Notificaciones solo permite “Ver”: el rol recibe los avisos que le corresponden.</p>
      <div className="ui-admin-only">
        <span aria-hidden="true">
          <Lock />
        </span>
        <div>
          <strong>Solo para administradores</strong>
          <p className="hint">Estos módulos no se asignan a roles.</p>
          <div className="ui-role-chips">
            {ADMIN_ONLY_MODULES.map((m) => (
              <Chip key={m}>{m}</Chip>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
