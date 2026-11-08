import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Pencil } from "@/components/icons";
import { DeleteRoleDialog } from "@/components/roles/delete-role-dialog";
import { RoleDetail } from "@/components/roles/role-detail";
import { buttonClass } from "@/components/ui/button-class";
import { PageHeader } from "@/components/ui/page-header";
import { requireRoleUser } from "../guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Rol · Argos" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function Detail({ params }: { params: PageProps<"/roles/[id]">["params"] }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { actor, org, roles } = await requireRoleUser();
  const role = await roles.roles.getById(id);
  if (!role || role.ownerId !== actor.userId) notFound();
  const [companies, assigned] = await Promise.all([org.listCompanies(actor), roles.roles.listUsers([id])]);
  return (
    <div className="stack">
      <PageHeader
        title={role.name}
        description="Detalle del rol en solo lectura."
        breadcrumbs={[{ label: "Roles", href: "/roles" }, { label: role.name }]}
        actions={
          <>
            <Link className={buttonClass("outline", "md")} href={`/roles/${role.id}/editar`}>
              <Pencil aria-hidden="true" />
              Editar
            </Link>
            <DeleteRoleDialog roleId={role.id} name={role.name} />
          </>
        }
      />
      <RoleDetail
        permissions={role.permissions}
        grants={role.specialPermissions}
        sessionSeconds={role.sessionSeconds}
        allCompanies={companies.map((c) => ({ id: c.id, name: c.name, allowed: !role.excludedCompanyIds.includes(c.id) }))}
        users={assigned.filter((u) => u.roleId === id).map((u) => u.displayName)}
      />
    </div>
  );
}

export default function RoleDetailPage(props: PageProps<"/roles/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Detail params={props.params} />
    </Suspense>
  );
}
