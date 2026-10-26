import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ShieldCheck } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { requireOrgUser } from "../../guard";
import { GrantAccess, RevokeAccess } from "./admin-actions";
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
      <div className="row">
        <h1 className="page-title">Administradores</h1>
        <span className="spacer" />
        <Link className="btn btn-secondary" href={`/companias/${id}`}>
          Volver a {company.name}
        </Link>
        <GrantAccess companyId={id} candidates={candidates} />
      </div>
      <Card aria-labelledby="h-adm">
        <h2 className="h2" id="h-adm">
          Con acceso a {company.name}
        </h2>
        <ul className="list" aria-label="Administradores con acceso">
          {profiles.map((p) => (
            <li key={p.id} className="list-row tree-row">
              <span className="row">
                <span className="icon-dot" aria-hidden="true">
                  <ShieldCheck />
                </span>
                <strong>{p.displayName}</strong>
                {p.id === company.founderId && <Chip variant="open">Fundador</Chip>}
              </span>
              {canRevoke && p.id !== company.founderId && (
                <RevokeAccess companyId={id} adminId={p.id} name={p.displayName} />
              )}
            </li>
          ))}
        </ul>
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
