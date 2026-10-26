import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { requireOrgUser } from "../../guard";
import Loading from "./loading";
import { SettingsForm } from "./settings-form";

export const instant = false;

export const metadata: Metadata = { title: "Ajustes · Argos" };

async function Settings({ params }: { params: PageProps<"/companias/[id]/ajustes">["params"] }) {
  const { id } = await params;
  const { actor, org } = await requireOrgUser();
  if (actor.kind !== "admin") notFound();
  const company = await org.companies.getById(id);
  if (!company) notFound();

  return (
    <div className="stack">
      <div className="row">
        <h1 className="page-title">Ajustes</h1>
        <span className="spacer" />
        <Link className="btn btn-secondary" href={`/companias/${id}`}>
          Volver a {company.name}
        </Link>
      </div>
      <Card aria-labelledby="h-ses">
        <h2 className="h2" id="h-ses">
          Sesión de {company.name}
        </h2>
        <SettingsForm companyId={id} hours={company.sessionCapSeconds / 3600} />
      </Card>
    </div>
  );
}

export default function SettingsPage(props: PageProps<"/companias/[id]/ajustes">) {
  return (
    <Suspense fallback={<Loading />}>
      <Settings params={props.params} />
    </Suspense>
  );
}
