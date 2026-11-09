import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { StatTile } from "@/components/ui/stat-tile";
import { PermissionsReadOnly, SpecialsReadOnly } from "@/components/roles/role-detail";
import { type RolePreviewSource, rolePreview } from "./user-form-logic";

export function RolePreview({ role, companyId, companyName }: { role: RolePreviewSource | undefined; companyId: string; companyName: string }) {
  const p = rolePreview(role, companyId);
  if (!role || !p) {
    return (
      <p className="ui-note" id="roleId-hint">
        Elige un rol para ver qué podrá hacer esta persona. Puedes cambiarlo después.
      </p>
    );
  }
  return (
    <div className="stack" id="roleId-hint" aria-live="polite">
      {!p.validForCompany && (
        <Alert variant="danger" title="Este rol no vale en esta compañía.">
          {role.name} no está disponible para {companyName}. Elige otro rol.
        </Alert>
      )}
      <div className="ui-detail-grid">
        {p.stats.map((s) => (
          <StatTile key={s.label} icon={s.icon} label={s.label} value={s.value} />
        ))}
      </div>
      <Card>
        <h3 className="ui-detail-title">Permisos por módulo</h3>
        <PermissionsReadOnly permissions={role.permissions} />
      </Card>
      <Card>
        <h3 className="ui-detail-title">Permisos especiales</h3>
        <SpecialsReadOnly grants={role.grants} />
      </Card>
      <Card>
        <h3 className="ui-detail-title">Compañías donde vale</h3>
        <div className="ui-role-chips">{p.allowed.length === 0 ? "Ninguna" : p.allowed.map((c) => <Chip key={c} variant="ring">{c}</Chip>)}</div>
      </Card>
      {role.users.length > 0 && (
        <Card>
          <h3 className="ui-detail-title">Ya lo usan</h3>
          <ul className="ui-role-perms">
            {role.users.map((u, i) => (
              <li key={`${i}|${u}`}>
                <Avatar name={u} size="sm" />
                {u}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
