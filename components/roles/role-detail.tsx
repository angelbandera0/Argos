import type { Module, PermissionSet, SpecialGrant } from "@/core/domain/permissions";
import { NAV_ICONS } from "@/components/icons";
import { Accordion, type AccordionEntry } from "@/components/ui/accordion";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { StatTile } from "@/components/ui/stat-tile";
import { companiesLabel, sessionLabel, usersLabel } from "./role-card-data";
import { grantedModules, groupedSpecials } from "./role-form-logic";

const { Check } = NAV_ICONS;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function PermissionsReadOnly({ permissions }: { permissions: Record<Module, PermissionSet> }) {
  const modules = grantedModules(permissions);
  if (modules.length === 0) return <p className="hint">Este rol no tiene permisos de módulo.</p>;
  return (
    <ul className="ui-role-perms">
      {modules.map((m) => (
        <li key={m.key}>
          <strong>{m.label}</strong>
          <span className="ui-role-chips">
            {m.ops.map(({ op, label }) => (
              <Chip key={op} variant="alert">
                <Check aria-hidden="true" />
                {label}
              </Chip>
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function SpecialsReadOnly({ grants }: { grants: SpecialGrant[] }) {
  const groups = groupedSpecials(grants);
  if (groups.length === 0) return <p className="hint">Sin permisos especiales</p>;
  return (
    <div className="stack">
      {groups.map((g) => (
        <section key={g.scope} className="ui-special-group">
          <h4 className="ui-special-scope">{g.scope}</h4>
          <ul className="ui-role-specials">
            {g.items.map((d) => (
              <li key={d.key}>
                <div className="ui-role-special-text">
                  <strong>{d.label}</strong>
                  <span>{d.description}</span>
                </div>
                {d.warehouse && <Chip variant="ring">Almacén general</Chip>}
                <Badge variant="success">Activo</Badge>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function UsersList({ users }: { users: string[] }) {
  return (
    <ul className="ui-role-perms">
      {users.map((u, i) => (
        <li key={`${i}|${u}`}>
          <Avatar name={u} size="sm" />
          {u}
        </li>
      ))}
    </ul>
  );
}

export function roleSections({
  permissions,
  grants,
  allowed,
  users,
  usersTitle,
}: {
  permissions: Record<Module, PermissionSet>;
  grants: SpecialGrant[];
  allowed: string[];
  users: string[];
  usersTitle: string;
}): AccordionEntry[] {
  const mods = grantedModules(permissions).length;
  const specials = groupedSpecials(grants).reduce((n, g) => n + g.items.length, 0);
  const items: AccordionEntry[] = [
    { value: "modules", title: "Permisos por módulo", summary: plural(mods, "módulo", "módulos"), content: <PermissionsReadOnly permissions={permissions} /> },
    { value: "specials", title: "Permisos especiales", summary: plural(specials, "especial", "especiales"), content: <SpecialsReadOnly grants={grants} /> },
    {
      value: "companies",
      title: "Compañías donde vale",
      summary: plural(allowed.length, "compañía", "compañías"),
      content: <div className="ui-role-chips">{allowed.length === 0 ? "Ninguna" : allowed.map((c) => <Chip key={c} variant="ring">{c}</Chip>)}</div>,
    },
  ];
  if (users.length > 0) items.push({ value: "users", title: usersTitle, summary: plural(users.length, "usuario", "usuarios"), content: <UsersList users={users} /> });
  return items;
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
        <StatTile icon="History" label="Sesión" value={sessionLabel(sessionSeconds)} />
        <StatTile icon="Users" label="Usuarios asignados" value={usersLabel(users.length)} />
      </div>
      <Accordion variant="cards" multiple defaultValue={["modules"]} items={roleSections({ permissions, grants, allowed, users, usersTitle: "Usuarios con este rol" })} />
    </div>
  );
}
