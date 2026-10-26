import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus, Search, Users } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { requireUserAdmin } from "./guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Usuarios · Argos" };

const STATUS = {
  active: { label: "Activo", variant: "ring" },
  locked: { label: "Bloqueado", variant: "alert" },
  deactivated: { label: "Desactivado", variant: "neutral" },
} as const;

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

const NewUserLink = () => (
  <Link className="btn btn-primary" href="/usuarios/nuevo">
    <Plus aria-hidden="true" />
    Nuevo usuario
  </Link>
);

async function UserList({ searchParams }: { searchParams: PageProps<"/usuarios">["searchParams"] }) {
  const { users, company } = await requireUserAdmin();
  if (!company) {
    return (
      <Card className="empty">
        <span className="icon-dot" aria-hidden="true">
          <Users />
        </span>
        <p>Elige una compañía arriba para ver sus usuarios.</p>
      </Card>
    );
  }
  const { q, estado } = await searchParams;
  const qs = typeof q === "string" ? q : "";
  const query = qs.trim().toLowerCase();
  const status = typeof estado === "string" && estado in STATUS ? estado : "";
  const all = await users.users.listForCompany(company.id);
  const shown = all.filter(
    (u) =>
      (!status || u.status === status) &&
      (u.displayName.toLowerCase().includes(query) || (u.username ?? "").includes(query)),
  );

  if (all.length === 0) {
    return (
      <Card className="empty">
        <span className="icon-dot" aria-hidden="true">
          <Users />
        </span>
        <p>Aún no hay usuarios en {company.name}. Crea el primero para que pueda entrar con su PIN.</p>
        <NewUserLink />
      </Card>
    );
  }

  return (
    <Card>
      <form className="row" role="search">
        <div className="search">
          <label className="sr-only" htmlFor="q">
            Buscar usuario
          </label>
          <Search aria-hidden="true" />
          <input id="q" name="q" type="search" defaultValue={qs} placeholder="Buscar por nombre o usuario" />
        </div>
        <label className="sr-only" htmlFor="estado">
          Estado
        </label>
        <select className="select" id="estado" name="estado" defaultValue={status} style={{ width: "auto" }}>
          <option value="">Todos los estados</option>
          {Object.entries(STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <button className="btn btn-secondary" type="submit">
          Filtrar
        </button>
      </form>
      {shown.length === 0 ? (
        <p className="muted">Ningún usuario coincide con la búsqueda.</p>
      ) : (
        <ul className="list" aria-label="Usuarios">
          {shown.map((u) => (
            <li key={u.id}>
              <Link className="list-row admin-row" href={`/usuarios/${u.id}`}>
                <span className="avatar" role="img" aria-label={u.displayName}>
                  {initials(u.displayName)}
                </span>
                <span>
                  <strong>{u.displayName}</strong>
                  <br />
                  <span className="caption mono">{u.username}</span>
                </span>
                <Chip variant={STATUS[u.status].variant}>{STATUS[u.status].label}</Chip>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function UsersPage(props: PageProps<"/usuarios">) {
  return (
    <>
      <div className="topbar">
        <h1 className="page-title">Usuarios</h1>
        <span className="spacer" />
        <NewUserLink />
      </div>
      <Suspense fallback={<Loading />}>
        <UserList searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}
