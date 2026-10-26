import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus, ShieldCheck } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { makeListAdmins } from "@/core/application/use-cases/access/list-admins";
import { makeUserRepository } from "@/infrastructure/supabase/user-repository";
import { requireSuperadmin } from "../guard";
import Loading from "./loading";

// The session read cannot be prerendered (T-04): opt out of instant-navigation validation.
export const instant = false;

export const metadata: Metadata = { title: "Administradores · Argos" };

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

async function AdminList() {
  const { supabase, actor } = await requireSuperadmin();
  const admins = await makeListAdmins({ users: makeUserRepository(supabase) })(actor);

  if (admins.length === 0) {
    return (
      <Card className="empty">
        <span className="icon-dot" aria-hidden="true">
          <ShieldCheck />
        </span>
        <p>Aún no hay administradores. Crea el primero para que pueda registrar compañías.</p>
        <Link className="btn btn-primary" href="/superadmin/administradores/nuevo">
          <Plus aria-hidden="true" />
          Nuevo administrador
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <ul className="list" aria-label="Administradores">
        {admins.map((a) => (
          <li className="list-row admin-row" key={a.id}>
            <span className="avatar" role="img" aria-label={a.displayName}>
              {initials(a.displayName)}
            </span>
            <strong>{a.displayName}</strong>
            {a.status !== "active" ? (
              <Chip variant="alert">Desactivado</Chip>
            ) : a.mustChangePassword ? (
              <Chip variant="open">Pendiente de primer ingreso</Chip>
            ) : (
              <Chip variant="ring">Activo</Chip>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function AdministradoresPage() {
  return (
    <>
      <div className="topbar">
        <h1 className="page-title">Administradores</h1>
        <span className="spacer" />
        <Link className="btn btn-primary" href="/superadmin/administradores/nuevo">
          <Plus aria-hidden="true" />
          Nuevo administrador
        </Link>
      </div>
      <Suspense fallback={<Loading />}>
        <AdminList />
      </Suspense>
    </>
  );
}
