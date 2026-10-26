import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { NewUserForm } from "@/components/users/new-user-form";
import { Card } from "@/components/ui/card";
import { loadStores, requireUserAdmin } from "../guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Nuevo usuario · Argos" };

async function Guarded() {
  const { actor, org, roles, company } = await requireUserAdmin();
  if (!company) return <Card>Elige una compañía arriba para crear usuarios.</Card>;
  const [mine, stores] = await Promise.all([roles.listRoles(actor), loadStores(org, company.id)]);
  const available = mine.filter((r) => !r.excludedCompanyIds.includes(company.id));
  const active = stores.filter((s) => s.active);
  if (available.length === 0) {
    return (
      <Card>
        <p>
          Antes de crear usuarios necesitas un rol. <Link href="/roles/nuevo">Crear un rol</Link>
        </p>
      </Card>
    );
  }
  if (active.length === 0) {
    return (
      <Card>
        <p>
          {company.name} no tiene tiendas activas. <Link href="/companias">Ir a compañías</Link>
        </p>
      </Card>
    );
  }
  return (
    <NewUserForm
      code={company.code}
      roles={available.map((r) => ({ id: r.id, name: r.name }))}
      stores={active.map(({ id, name, site }) => ({ id, name, site }))}
    />
  );
}

export default function NewUserPage() {
  return (
    <>
      <div className="topbar">
        <h1 className="page-title">Nuevo usuario</h1>
      </div>
      <Suspense fallback={<Loading />}>
        <Guarded />
      </Suspense>
    </>
  );
}
