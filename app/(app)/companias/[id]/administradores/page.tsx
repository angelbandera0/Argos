import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { buttonClass } from "@/components/ui/button-class";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireOrgUser } from "../../guard";
import { GrantAccess } from "./admin-actions";
import { AdminTable } from "./admin-table";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Administradores · Argos" };

async function Admins({ params }: { params: PageProps<"/companias/[id]/administradores">["params"] }) {
  const { id } = await params;
  const { actor, org } = await requireOrgUser();
  const company = await org.companies.getById(id);
  if (!company) notFound();

  const ids = await org.companies.listAdmins(id);
  const profiles = (await Promise.all(ids.map((a) => org.users.getProfile(a)))).filter((p) => p !== null);
  profiles.sort((a, b) => Number(b.id === company.founderId) - Number(a.id === company.founderId));
  const canRevoke = actor.kind === "superadmin" || company.founderId === actor.userId;
  const candidates = (await org.users.listAdmins())
    .filter((p) => p.status === "active" && !ids.includes(p.id))
    .map((p) => ({ id: p.id, name: p.displayName }));

  return (
    <div className="stack">
      <PageHeader
        title="Administradores"
        breadcrumbs={[
          { label: "Compañías", href: "/companias" },
          { label: company.name, href: `/companias/${id}` },
          { label: "Administradores" },
        ]}
        actions={
          <>
            <Link className={buttonClass("secondary", "md")} href={`/companias/${id}`}>
              Volver a {company.name}
            </Link>
            <GrantAccess companyId={id} candidates={candidates} />
          </>
        }
      />
      <Card aria-labelledby="h-adm">
        <h2 className="h2" id="h-adm">
          Con acceso a {company.name}
        </h2>
        <AdminTable
          companyId={id}
          canRevoke={canRevoke}
          rows={profiles.map((p) => ({ id: p.id, name: p.displayName, founder: p.id === company.founderId }))}
        />
        {!canRevoke && <p className="hint">Solo el fundador o el superadmin pueden quitar el acceso.</p>}
      </Card>
    </div>
  );
}

export default function AdminsPage(props: PageProps<"/companias/[id]/administradores">) {
  return (
    <Suspense fallback={<Loading />}>
      <Admins params={props.params} />
    </Suspense>
  );
}
