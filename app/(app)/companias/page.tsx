import type { Metadata } from "next";
import { Suspense } from "react";
import { NewCompanyButton } from "@/components/org/new-company-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { CompanyTable } from "./company-table";
import { requireOrgUser } from "./guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Compañías · Argos" };

async function CompanyList({ searchParams }: { searchParams: PageProps<"/companias">["searchParams"] }) {
  const { actor, org } = await requireOrgUser();
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").trim().toLowerCase();
  const all = await org.listCompanies(actor);
  const companies = all.filter((c) => c.name.toLowerCase().includes(query) || c.code.includes(query));
  const canCreate = actor.kind === "admin";

  if (all.length === 0) {
    return (
      <EmptyState
        icon="Building2"
        title={canCreate ? "Aún no tienes compañías." : "Aún no hay compañías registradas."}
        action={
          canCreate && <NewCompanyButton />
        }
      >
        {canCreate ? "Crea la primera para registrar sus sedes y tiendas." : undefined}
      </EmptyState>
    );
  }

  return (
    <>
      <ListToolbar
        search={{ label: "Buscar compañía", placeholder: "Buscar por nombre o código", defaultValue: typeof q === "string" ? q : undefined }}
      />
      <CompanyTable rows={companies.map((c) => ({ id: c.id, name: c.name, code: c.code, status: c.status }))} />
    </>
  );
}

async function CreateAction() {
  const { actor } = await requireOrgUser();
  return actor.kind === "admin" ? <NewCompanyButton /> : null;
}

export default function CompaniasPage(props: PageProps<"/companias">) {
  return (
    <div className="stack">
      <PageHeader
        title="Compañías"
        actions={
          <Suspense fallback={null}>
            <CreateAction />
          </Suspense>
        }
      />
      <Suspense fallback={<Loading />}>
        <CompanyList searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
