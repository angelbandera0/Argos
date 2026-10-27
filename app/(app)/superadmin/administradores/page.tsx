import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "@/components/icons";
import { buttonClass } from "@/components/ui/button-class";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { makeListAdmins } from "@/core/application/use-cases/access/list-admins";
import { makeUserRepository } from "@/infrastructure/supabase/user-repository";
import { requireSuperadmin } from "../guard";
import { AdminTable } from "./admin-table";
import Loading from "./loading";

// The session read cannot be prerendered (T-04): opt out of instant-navigation validation.
export const instant = false;

export const metadata: Metadata = { title: "Administradores · Argos" };

const NewLink = () => (
  <Link className={buttonClass("primary", "md")} href="/superadmin/administradores/nuevo">
    <Plus aria-hidden="true" />
    Nuevo administrador
  </Link>
);

async function AdminList() {
  const { supabase, actor } = await requireSuperadmin();
  const admins = await makeListAdmins({ users: makeUserRepository(supabase) })(actor);

  if (admins.length === 0) {
    return (
      <EmptyState icon="ShieldCheck" title="Aún no hay administradores." action={<NewLink />}>
        Crea el primero para que pueda registrar compañías.
      </EmptyState>
    );
  }

  return (
    <AdminTable
      rows={admins.map((a) => ({
        id: a.id,
        displayName: a.displayName,
        status: a.status,
        mustChangePassword: a.mustChangePassword,
      }))}
    />
  );
}

export default function AdministradoresPage() {
  return (
    <div className="stack">
      <PageHeader title="Administradores" actions={<NewLink />} />
      <Suspense fallback={<Loading />}>
        <AdminList />
      </Suspense>
    </div>
  );
}
