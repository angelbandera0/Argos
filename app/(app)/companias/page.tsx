import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { NewCompanyButton } from "@/components/org/new-company-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { filterCompanies, parseStatus, statusCounts } from "./company-filters";
import { CompanyList as Companies } from "./company-list";
import { ACTIVE_COMPANY_COOKIE, requireOrgUser } from "./guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Compañías · Argos" };

async function CompanyList({ searchParams }: { searchParams: PageProps<"/companias">["searchParams"] }) {
  const { actor, org } = await requireOrgUser();
  const { q, estado, vista } = await searchParams;
  const text = typeof q === "string" ? q : "";
  const status = parseStatus(estado);
  const all = await org.listCompanies(actor);
  const companies = filterCompanies(all, text, status);
  const activeId = (await cookies()).get(ACTIVE_COMPANY_COOKIE)?.value;
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
    <Companies
      rows={companies.map((c) => ({ id: c.id, name: c.name, code: c.code, status: c.status, hours: c.sessionCapSeconds / 3600 }))}
      q={text}
      status={status}
      view={vista === "lista" ? "lista" : "grilla"}
      counts={statusCounts(all, text)}
      activeId={activeId}
      canEdit={canCreate}
    />
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
