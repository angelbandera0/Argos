"use client";

import type { Module, PermissionSet, SpecialGrant } from "@/core/domain/permissions";
import { NAV_ICONS } from "@/components/icons";
import { Switch } from "@/components/ui/switch";
import { ToggleCard } from "@/components/ui/toggle-card";
import {
  MODULE_GROUPS,
  SEE_COSTS,
  setWarehouse,
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

export function SpecialPermissions({ permissions, grants, onGrants }: Omit<Props, "onPermissions">) {
  return (
    <>
      <SeeCostsCard grants={grants} onGrants={onGrants} />
      {MODULE_GROUPS.filter((m) => m.specials.length > 0).map((m) => (
        <div key={m.key} className="stack">
          <strong>{m.label}</strong>
          {!permissions[m.key].view && <p className="hint">Activa «Ver» en {m.label} para poder dar estos permisos.</p>}
          {m.specials.map((s) => {
            const grant = grants.find((g) => g.permission === s.key);
            return (
              <div key={s.key} className="stack">
                <Switch
                  label={s.label}
                  description={s.description}
                  disabled={!permissions[m.key].view}
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
        </div>
      ))}
    </>
  );
}
