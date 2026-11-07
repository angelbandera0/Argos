"use client";

import type { Module, PermissionSet, SpecialGrant } from "@/core/domain/permissions";
import { NAV_ICONS } from "@/components/icons";
import { Accordion } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { Switch } from "@/components/ui/switch";
import { ToggleCard } from "@/components/ui/toggle-card";
import {
  isViewLocked,
  MODULE_GROUPS,
  modulePermissionCount,
  OPS,
  permissionSummary,
  SEE_COSTS,
  setWarehouse,
  toggle,
  toggleSpecial,
} from "./role-form-logic";

type Props = {
  permissions: Record<Module, PermissionSet>;
  grants: SpecialGrant[];
  onPermissions: (next: Record<Module, PermissionSet>) => void;
  onGrants: (next: SpecialGrant[]) => void;
};

export function SeeCostsCard({ grants, onGrants }: Pick<Props, "grants" | "onGrants">) {
  return (
    <ToggleCard
      tone="delicate"
      icon={<NAV_ICONS.ShieldCheck />}
      title={SEE_COSTS.label}
      description={SEE_COSTS.description}
      checked={grants.some((g) => g.permission === "see_costs")}
      onCheckedChange={(on) => onGrants(toggleSpecial(grants, "see_costs", on))}
    />
  );
}

export function ModulePermissions({ permissions, grants, onPermissions, onGrants }: Props) {
  return (
    <Accordion
      variant="cards"
      items={MODULE_GROUPS.map((m) => {
        const p = permissions[m.key];
        const count = modulePermissionCount(p, m, grants);
        const ops = m.key === "notifications" ? OPS.slice(0, 1) : OPS;
        return {
          value: m.key,
          title: m.label,
          subtitle: m.description,
          icon: m.icon,
          summary: permissionSummary(p),
          badge: <Badge>{count} {count === 1 ? "permiso" : "permisos"}</Badge>,
          content: (
            <div className="stack">
              <div className="ui-perm-templates" role="group" aria-label={`Permisos de ${m.label}`}>
                {ops.map(({ op, label }) => (
                  <Chip
                    key={op}
                    pressed={p[op]}
                    aria-disabled={op === "view" && isViewLocked(p) ? true : undefined}
                    onPressedChange={(on) => !(op === "view" && isViewLocked(p)) && onPermissions({ ...permissions, [m.key]: toggle(p, op, on) })}
                  >
                    {label}
                  </Chip>
                ))}
              </div>
              {isViewLocked(p) && <p className="hint">«Ver» queda marcado porque lo necesitan las demás acciones.</p>}
              {m.specials.length > 0 && (
                <>
                  <strong className="hint">PERMISOS ESPECIALES</strong>
                  {!p.view && <p className="hint">Activa «Ver» para poder dar permisos especiales.</p>}
                  {m.specials.map((s) => {
                    const grant = grants.find((g) => g.permission === s.key);
                    return (
                      <div key={s.key} className="stack">
                        <Switch
                          label={s.label}
                          description={s.description}
                          disabled={!p.view}
                          checked={!!grant}
                          onCheckedChange={(on) => onGrants(toggleSpecial(grants, s.key, on))}
                        />
                        {grant && s.scoped && (
                          <Switch
                            label="Almacén general"
                            description="Además de las tiendas, vale en el almacén general."
                            checked={grant.warehouse}
                            onCheckedChange={(on) => onGrants(setWarehouse(grants, s.key, on))}
                          />
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          ),
        };
      })}
      multiple
    />
  );
}
