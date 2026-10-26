import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Check, Lock } from "@/components/icons";
import { AssignmentsForm } from "@/components/users/assignments-form";
import { UserActions } from "@/components/users/user-actions";
import { UserTabs } from "@/components/users/user-tabs";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { loadStores, requireUserAdmin } from "../guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Usuario · Argos" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EVENTS = {
  login_ok: { label: "Inicio de sesión correcto", fail: false },
  login_failed: { label: "PIN incorrecto", fail: true },
  locked: { label: "Usuario bloqueado", fail: true },
  unlocked: { label: "Usuario desbloqueado", fail: false },
  pin_reset: { label: "PIN restablecido", fail: false },
  password_changed: { label: "Contraseña cambiada", fail: false },
} as const;

const CHANNELS = { ui: "Pantalla", app: "App", api: "API", mcp: "MCP", system: "Sistema" } as const;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

const when = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" });

async function Detail({ params }: { params: PageProps<"/usuarios/[id]">["params"] }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { actor, org, users, roles } = await requireUserAdmin();
  const profile = await users.users.getProfile(id);
  if (!profile || profile.kind !== "operator" || !profile.companyId) notFound();
  const [company, stores, assignments, mine, events] = await Promise.all([
    org.companies.getById(profile.companyId),
    loadStores(org, profile.companyId),
    users.users.listAssignments(id),
    roles.listRoles(actor),
    users.users.listAuthEvents(id, 20),
  ]);
  const owned = new Set(mine.map((r) => r.id));
  const assignedRoleIds = new Set(assignments.map((a) => a.roleId));
  const options = mine
    .filter((r) => !r.excludedCompanyIds.includes(profile.companyId!) || assignedRoleIds.has(r.id))
    .map((r) => ({ id: r.id, name: r.name }));
  const foreignStoreIds = assignments.filter((a) => !owned.has(a.roleId)).map((a) => a.storeId);
  const deactivated = profile.status === "deactivated";

  return (
    <div className="stack">
      <Card>
        <div className="card-head row">
          <span className="avatar" role="img" aria-label={profile.displayName}>
            {initials(profile.displayName)}
          </span>
          <div className="stack">
            <h1 className="h2">{profile.displayName}</h1>
            <span className="caption">
              <span className="mono">{profile.username}</span> · {company?.name}
            </span>
          </div>
          {profile.status === "locked" ? (
            <Chip variant="alert">
              <Lock aria-hidden="true" />
              Bloqueado
            </Chip>
          ) : deactivated ? (
            <Chip>Desactivado</Chip>
          ) : (
            <Chip>
              <Check aria-hidden="true" />
              Activo
            </Chip>
          )}
          <span className="spacer" />
          <UserActions userId={profile.id} name={profile.displayName} status={profile.status} />
        </div>
        {profile.status === "locked" && (
          <div className="notice notice-alert">
            <p>
              Este usuario se bloqueó tras 5 PIN incorrectos. Al desbloquearlo se genera un PIN nuevo y se cierran sus
              sesiones.
            </p>
          </div>
        )}
      </Card>
      <UserTabs
        stores={
          <Card>
            <h2 className="h2">Tiendas asignadas</h2>
            {deactivated ? (
              <p className="muted">Este usuario está desactivado y ya no se puede modificar.</p>
            ) : (
              <AssignmentsForm
                userId={profile.id}
                stores={stores}
                roles={options}
                initial={assignments.map((a) => ({ storeId: a.storeId, roleId: a.roleId }))}
                foreignStoreIds={foreignStoreIds}
              />
            )}
          </Card>
        }
        activity={
          <Card>
            <div className="card-head row">
              <h2 className="h2">Accesos recientes</h2>
              <span className="spacer" />
              <span className="caption">Solo lo ven los administradores</span>
            </div>
            {events.length === 0 ? (
              <p className="muted">Todavía no hay accesos registrados.</p>
            ) : (
              <ul className="list" aria-label="Accesos recientes">
                {events.map((e, i) => (
                  <li className="list-row event-row" key={i}>
                    <span className="caption mono">{when.format(e.createdAt)}</span>
                    <span>{EVENTS[e.event].label}</span>
                    <Chip variant={EVENTS[e.event].fail ? "alert" : "neutral"}>{CHANNELS[e.channel]}</Chip>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        }
      />
    </div>
  );
}

export default function UserDetailPage(props: PageProps<"/usuarios/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Detail params={props.params} />
    </Suspense>
  );
}
