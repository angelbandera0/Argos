"use client";

import type { Module, Op, PermissionSet } from "@/core/domain/permissions";
import { Checkbox } from "@/components/ui/checkbox";

export const MODULES: { key: Module; label: string; hint: string }[] = [
  {
    key: "products",
    label: "Productos",
    hint: "Eliminar no borra: el producto se marca como eliminado y queda en el historial. Con “Ver” el rol también verá el historial de Productos.",
  },
];

const OPS: { op: Op; label: string }[] = [
  { op: "view", label: "Ver" },
  { op: "create", label: "Crear" },
  { op: "edit", label: "Editar" },
  { op: "delete", label: "Eliminar" },
];

export function toggle(set: PermissionSet, op: Op, on: boolean): PermissionSet {
  if (op === "view") return on ? { ...set, view: true } : { view: false, create: false, edit: false, delete: false };
  return { ...set, [op]: on, view: on ? true : set.view };
}

export function PermissionMatrix({
  value,
  onChange,
}: {
  value: Record<Module, PermissionSet>;
  onChange: (next: Record<Module, PermissionSet>) => void;
}) {
  return (
    <>
      {MODULES.map(({ key, label, hint }) => (
        <div className="inner" key={key}>
          <strong>{label}</strong>
          <div className="perm-grid" role="group" aria-label={`Permisos sobre ${label}`}>
            {OPS.map(({ op, label: l }) => (
              <Checkbox
                key={op}
                name={`${key}.${op}`}
                label={l}
                checked={value[key][op]}
                onCheckedChange={(on) => onChange({ ...value, [key]: toggle(value[key], op, on) })}
              />
            ))}
          </div>
          <span className="hint">{hint}</span>
        </div>
      ))}
    </>
  );
}
