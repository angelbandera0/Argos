import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { requireOrgUser } from "../guard";
import Loading from "./loading";
import { NewCompanyForm } from "./new-company-form";

export const instant = false;

export const metadata: Metadata = { title: "Nueva compañía · Argos" };

async function Guarded() {
  const { actor } = await requireOrgUser();
  if (actor.kind !== "admin") notFound();
  return <NewCompanyForm />;
}

export default function NewCompanyPage() {
  return (
    <div className="stack">
      <PageHeader
        title="Nueva compañía"
        breadcrumbs={[{ label: "Compañías", href: "/companias" }, { label: "Nueva compañía" }]}
      />
      <Suspense fallback={<Loading />}>
        <Guarded />
      </Suspense>
    </div>
  );
}
