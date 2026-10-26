import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { RoleForm } from "@/components/roles/role-form";
import { requireRoleUser } from "../guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Nuevo rol · Argos" };

const NONE = { view: false, create: false, edit: false, delete: false };

async function Editor() {
  const { actor, org } = await requireRoleUser();
  const companies = (await org.listCompanies(actor)).map((c) => ({ id: c.id, name: c.name, code: c.code }));
  return (
    <RoleForm
      roleId={null}
      companies={companies}
      initial={{ name: "", sessionSeconds: null, excludedCompanyIds: [], permissions: { products: NONE } }}
    />
  );
}

export default function NewRolePage() {
  return (
    <div className="stack">
      <PageHeader title="Nuevo rol" breadcrumbs={[{ label: "Roles", href: "/roles" }, { label: "Nuevo rol" }]} />
      <Suspense fallback={<Loading />}>
        <Editor />
      </Suspense>
    </div>
  );
}
