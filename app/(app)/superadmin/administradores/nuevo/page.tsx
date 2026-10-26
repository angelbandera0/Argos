import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { requireSuperadmin } from "../../guard";
import Loading from "./loading";
import { NewAdminForm } from "./new-admin-form";

export const instant = false;

export const metadata: Metadata = { title: "Nuevo administrador · Argos" };

async function Guarded() {
  await requireSuperadmin();
  return <NewAdminForm />;
}

export default function NewAdminPage() {
  return (
    <div className="stack">
      <PageHeader
        title="Nuevo administrador"
        breadcrumbs={[{ label: "Administradores", href: "/superadmin/administradores" }, { label: "Nuevo administrador" }]}
      />
      <Suspense fallback={<Loading />}>
        <Guarded />
      </Suspense>
    </div>
  );
}
