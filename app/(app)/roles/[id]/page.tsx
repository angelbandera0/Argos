import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Lock } from "@/components/icons";
import { Chip } from "@/components/ui/chip";
import { PageHeader } from "@/components/ui/page-header";
import { DeleteRoleDialog } from "@/components/roles/delete-role-dialog";
import { RoleForm } from "@/components/roles/role-form";
import { requireRoleUser } from "../guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Editar rol · Argos" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function Editor({ params }: { params: PageProps<"/roles/[id]">["params"] }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { actor, org, roles } = await requireRoleUser();
  const role = await roles.roles.getById(id);
  if (!role || role.ownerId !== actor.userId) notFound();
  const companies = (await org.listCompanies(actor)).map((c) => ({ id: c.id, name: c.name, code: c.code }));
  return (
    <div className="stack">
      <PageHeader
        title={`Rol: ${role.name}`}
        description="Define qué puede hacer y en qué compañías. Luego lo asignas a usuarios."
        breadcrumbs={[{ label: "Roles", href: "/roles" }, { label: role.name }]}
        actions={
          <>
            <Chip variant="ring">
              <Lock aria-hidden="true" />
              Solo tú ves y editas este rol
            </Chip>
            <DeleteRoleDialog roleId={role.id} name={role.name} />
          </>
        }
      />
      <RoleForm roleId={role.id} companies={companies} initial={role} />
    </div>
  );
}

export default function EditRolePage(props: PageProps<"/roles/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Editor params={props.params} />
    </Suspense>
  );
}
