import { Alert } from "@/components/ui/alert";
import { Accordion } from "@/components/ui/accordion";
import { StatTile } from "@/components/ui/stat-tile";
import { roleSections } from "@/components/roles/role-detail";
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
      <Accordion variant="cards" multiple defaultValue={["modules"]} items={roleSections({ permissions: role.permissions, grants: role.grants, allowed: p.allowed, users: role.users, usersTitle: "Ya lo usan" })} />
    </div>
  );
}
