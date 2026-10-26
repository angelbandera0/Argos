import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { KeyRound, Plus, Search } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { requireRoleUser } from "./guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Roles · Argos" };

async function RoleList({ searchParams }: { searchParams: PageProps<"/roles">["searchParams"] }) {
  const { actor, roles } = await requireRoleUser();
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").trim().toLowerCase();
  const all = await roles.listRoles(actor);
  const shown = all.filter((r) => r.name.toLowerCase().includes(query));

  if (all.length === 0) {
    return (
      <Card className="empty">
        <span className="icon-dot" aria-hidden="true">
          <KeyRound />
        </span>
        <p>Aún no tienes roles. Crea el primero para asignarlo a tus operadores.</p>
        <Link className="btn btn-primary" href="/roles/nuevo">
          <Plus aria-hidden="true" />
          Nuevo rol
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <form className="search" role="search">
        <label className="sr-only" htmlFor="q">
          Buscar rol
        </label>
        <Search aria-hidden="true" />
        <input id="q" name="q" type="search" defaultValue={typeof q === "string" ? q : undefined} placeholder="Buscar por nombre" />
      </form>
      {shown.length === 0 ? (
        <p className="muted">Ningún rol coincide con la búsqueda.</p>
      ) : (
        <ul className="list" aria-label="Roles">
          {shown.map((r) => (
            <li key={r.id}>
              <Link className="list-row company-row" href={`/roles/${r.id}`}>
                <span className="icon-dot" aria-hidden="true">
                  <KeyRound />
                </span>
                <strong>{r.name}</strong>
                <Chip variant="ring">
                  {r.excludedCompanyIds.length === 0
                    ? "Todas las compañías"
                    : `${r.excludedCompanyIds.length} excluida${r.excludedCompanyIds.length === 1 ? "" : "s"}`}
                </Chip>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function RolesPage(props: PageProps<"/roles">) {
  return (
    <>
      <div className="topbar">
        <h1 className="page-title">Roles</h1>
        <span className="spacer" />
        <Link className="btn btn-primary" href="/roles/nuevo">
          <Plus aria-hidden="true" />
          Nuevo rol
        </Link>
      </div>
      <Suspense fallback={<Loading />}>
        <RoleList searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
