import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";
import { NewCompanyButton } from "@/components/org/new-company-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { filterCompanies, pageSlice, parsePage, parseSort, parseStatus, sortCompanies, statusCounts } from "./company-filters";
import { summarize } from "./company-summary";
import { CompanyList as Companies } from "./company-list";
import { ACTIVE_COMPANY_COOKIE, requireOrgUser } from "./guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Compañías · Argos" };

async function CompaniesContent({ searchParams }: { searchParams: PageProps<"/companias">["searchParams"] }) {
  const { actor, org } = await requireOrgUser();
  const { q, estado, vista, orden, pagina } = await searchParams;
  const text = typeof q === "string" ? q : "";
  const status = parseStatus(estado);
  const all = await org.listCompanies(actor);
  const sort = parseSort(orden);
  const view = vista === "lista" ? "lista" : "grilla";
  const companies = sortCompanies(filterCompanies(all, text, status), sort);
  const { items, page } = view === "lista" ? { items: companies, page: 1 } : pageSlice(companies, parsePage(pagina));
  const summaries = view === "lista" ? [] : await Promise.all(items.map((c) => summarize(org, c.id)));
  const activeId = (await cookies()).get(ACTIVE_COMPANY_COOKIE)?.value;
  const canCreate = actor.kind === "admin";

  if (all.length === 0) {
    return (
      <>
      <PageHeader title="Compañías" actions={canCreate ? <NewCompanyButton /> : undefined} />
      <EmptyState
        icon="Building2"
        title={canCreate ? "Aún no tienes compañías." : "Aún no hay compañías registradas."}
        action={
          canCreate && <NewCompanyButton />
        }
      >
        {canCreate ? "Crea la primera para registrar sus sedes y tiendas." : undefined}
      </EmptyState>
      </>
    );
  }

  const active = all.filter((c) => c.status === "active").length;
  return (
    <>
      <PageHeader
        title="Compañías"
        description={`${all.length} ${all.length === 1 ? "compañía" : "compañías"} · ${active} ${active === 1 ? "activa" : "activas"}`}
        actions={canCreate ? <NewCompanyButton /> : undefined}
      />
      <Companies
        rows={items.map((c, i) => ({
          id: c.id,
          name: c.name,
          code: c.code,
          status: c.status,
          hours: c.sessionCapSeconds / 3600,
          summary: summaries[i],
        }))}
        q={text}
        status={status}
        view={view}
        sort={sort}
        page={page}
        total={companies.length}
        counts={statusCounts(all, text)}
        activeId={activeId}
        canEdit={canCreate}
      />
    </>
  );
}

export default function CompaniasPage(props: PageProps<"/companias">) {
  return (
    <div className="stack">
      <Suspense fallback={
          <>
            <PageHeader title="Compañías" />
            <Loading />
          </>
        }>
        <CompaniesContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
