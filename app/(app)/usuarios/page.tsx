import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "@/components/icons";
import { UserList } from "@/components/users/user-list";
import {
  PAGE_SIZE,
  type StateFilter,
  lastAccessLabel,
  matchesState,
  parseOption,
  parsePage,
  parseState,
  storesSummary,
  userState,
} from "@/components/users/user-list-data";
import { buttonClass } from "@/components/ui/button-class";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { userTimeZone } from "../historial/guard";
import { loadStores, requireUserAdmin } from "./guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Usuarios · Argos" };

const NewUserLink = () => (
  <Link className={buttonClass("primary", "md")} href="/usuarios/nuevo">
    <Plus aria-hidden="true" />
    Nuevo usuario
  </Link>
);

async function UserListContent({ searchParams }: { searchParams: PageProps<"/usuarios">["searchParams"] }) {
  const { users, roles, org, actor, company } = await requireUserAdmin();
  if (!company) {
    return <EmptyState icon="Users" title="Elige una compañía arriba para ver sus usuarios." />;
  }
  const sp = await searchParams;
  const all = await users.users.listForCompany(company.id);
  if (all.length === 0) {
    return (
      <EmptyState icon="Users" title={`Aún no hay usuarios en ${company.name}.`} action={<NewUserLink />}>
        Crea el primero para que pueda entrar con su PIN.
      </EmptyState>
    );
  }

  const ids = all.map((u) => u.id);
  const [assignments, logins, storeList, roleList, tz] = await Promise.all([
    users.users.listAssignmentsFor(ids),
    users.users.lastLogins(ids),
    loadStores(org, company.id),
    roles.listRoles(actor),
    userTimeZone(),
  ]);
  const roleNames = new Map(roleList.map((r) => [r.id, r.name]));
  const storeNames = new Map(storeList.map((s) => [s.id, s.name]));
  const loginAt = new Map(logins.map((l) => [l.userId, l.at]));
  const activeStores = storeList.filter((s) => s.active).length;
  const now = new Date();

  const q = typeof sp.q === "string" ? sp.q : "";
  const query = q.trim().toLowerCase();
  const rol = parseOption(sp.rol, [...roleNames.keys()]);
  const tienda = parseOption(sp.tienda, [...storeNames.keys()]);
  const estado = parseState(sp.estado);

  const enriched = all.map((u) => {
    const mine = assignments.filter((a) => a.userId === u.id);
    const last = loginAt.get(u.id) ?? null;
    const roleIds = [...new Set(mine.map((a) => a.roleId))];
    return {
      u,
      mine,
      roleIds,
      state: userState(u.status, last),
      row: {
        id: u.id,
        displayName: u.displayName,
        username: u.username,
        role: roleNames.get(roleIds[0] ?? "") ?? null,
        stores: storesSummary(
          mine.map((a) => storeNames.get(a.storeId)).filter((n): n is string => !!n),
          activeStores,
        ),
        lastAccess: lastAccessLabel(last, now, tz.tz),
      },
    };
  });

  const base = enriched.filter(
    (e) =>
      (e.u.displayName.toLowerCase().includes(query) || (e.u.username ?? "").includes(query)) &&
      (!rol || e.roleIds.includes(rol)) &&
      (!tienda || e.mine.some((a) => a.storeId === tienda)),
  );
  const counts = Object.fromEntries(
    (["todos", "activos", "bloqueados", "inactivos"] as StateFilter[]).map((f) => [f, base.filter((e) => matchesState(f, e.state)).length]),
  ) as Record<StateFilter, number>;
  const shown = base.filter((e) => matchesState(estado, e.state));
  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const pagina = Math.min(parsePage(sp.pagina), pages);
  const stat = (state: string) => enriched.filter((e) => e.state === state).length;

  return (
    <>
      <div className="ui-user-stats">
        <StatTile dot="ink" label="Usuarios" value={all.length} />
        <StatTile dot="success" label="Activos" value={stat("active") + stat("locked")} />
        <StatTile dot="warning" label="Aún no han entrado" value={stat("never")} />
        <StatTile dot="muted" label="Inactivos" value={stat("inactive")} />
      </div>
      <UserList
        rows={shown.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE).map((e) => ({ ...e.row, state: e.state }))}
        total={shown.length}
        pageSize={PAGE_SIZE}
        filters={{ q, rol, tienda, estado, pagina }}
        counts={counts}
        roles={roleList.map((r) => ({ value: r.id, label: r.name }))}
        stores={storeList.map((s) => ({ value: s.id, label: s.name }))}
      />
    </>
  );
}

export default function UsersPage(props: PageProps<"/usuarios">) {
  return (
    <div className="stack">
      <PageHeader title="Usuarios" description={<Description />} actions={<NewUserLink />} />
      <Suspense fallback={<Loading />}>
        <UserListContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function CompanyName() {
  const { company } = await requireUserAdmin();
  return company?.name ?? "tu compañía";
}

function Description() {
  return (
    <>
      Personas que entran con su PIN en las tiendas de{" "}
      <Suspense fallback="tu compañía">
        <CompanyName />
      </Suspense>
      .
    </>
  );
}
