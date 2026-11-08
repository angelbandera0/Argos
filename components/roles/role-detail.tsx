import type { Module, PermissionSet, SpecialGrant } from "@/core/domain/permissions";
import { NAV_ICONS } from "@/components/icons";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { StatTile } from "@/components/ui/stat-tile";
import { companiesLabel, sessionLabel, usersLabel } from "./role-card-data";
import { ALL_MODULES, MODULE_GROUPS, OPS, SEE_COSTS, permissionSummary } from "./role-form-logic";

const { Check } = NAV_ICONS;

export function PermissionsReadOnly({ permissions }: { permissions: Record<Module, PermissionSet> }) {
  return (
    <ul className="ui-role-perms">
      {ALL_MODULES.map((m) => (
        <li key={m.key}>
          <strong>{m.label}</strong>
          <span className="ui-role-chips">
            {OPS.map(({ op, label }) =>
              permissions[m.key][op] ? (
                <Chip key={op} variant="alert">
                  <Check aria-hidden="true" />
                  {label}
                </Chip>
              ) : (
                <Chip key={op} className="ui-role-denied">
                  {label}
                  <span className="sr-only"> (no permitido)</span>
                </Chip>
              ),
            )}
          </span>
          <span className="sr-only">{permissionSummary(permissions[m.key])}</span>
        </li>
      ))}
    </ul>
  );
}

export function SpecialsReadOnly({ grants }: { grants: SpecialGrant[] }) {
  const defs = [SEE_COSTS, ...MODULE_GROUPS.flatMap((m) => m.specials)];
  const active = defs.filter((d) => grants.some((g) => g.permission === d.key));
  if (active.length === 0) return <p className="hint">Sin permisos especiales.</p>;
  return (
    <ul className="ui-role-perms">
      {active.map((d) => {
        const g = grants.find((x) => x.permission === d.key);
        return (
          <li key={d.key}>
            <strong>{d.label}</strong>
            {g?.warehouse && <Chip variant="ring">Almacén general</Chip>}
          </li>
        );
      })}
    </ul>
  );
}

export function RoleDetail({
  permissions,
  grants,
  sessionSeconds,
  allCompanies,
  users,
}: {
  permissions: Record<Module, PermissionSet>;
  grants: SpecialGrant[];
  sessionSeconds: number | null;
  allCompanies: { id: string; name: string; allowed: boolean }[];
  users: string[];
}) {
  const allowed = allCompanies.filter((c) => c.allowed).map((c) => c.name);
  return (
    <div className="stack">
      <div className="ui-detail-grid">
        <StatTile icon="Building2" label="Compañías" value={companiesLabel(allowed.length === allCompanies.length ? "all" : allowed)} />
        <StatTile icon="Clock" label="Sesión" value={sessionLabel(sessionSeconds)} />
        <StatTile icon="Users" label="Usuarios asignados" value={usersLabel(users.length)} />
      </div>
      <Card>
        <h2 className="section-title">Permisos por módulo</h2>
        <PermissionsReadOnly permissions={permissions} />
      </Card>
      <Card>
        <h2 className="section-title">Permisos especiales</h2>
        <SpecialsReadOnly grants={grants} />
      </Card>
      <div className="ui-detail-grid">
        <Card>
          <h2 className="section-title">Compañías donde vale</h2>
          <div className="ui-role-chips">
            {allowed.length === 0 ? "Ninguna" : allowed.map((c) => <Chip key={c} variant="ring">{c}</Chip>)}
          </div>
        </Card>
        <Card>
          <h2 className="section-title">Usuarios con este rol</h2>
          {users.length === 0 ? (
            <p className="hint">Ningún usuario lo tiene asignado.</p>
          ) : (
            <ul className="ui-role-perms">
              {users.map((u, i) => (
                <li key={`${i}|${u}`}>
                  <Avatar name={u} size="sm" />
                  {u}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
