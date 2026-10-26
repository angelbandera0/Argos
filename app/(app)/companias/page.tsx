import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "@/components/icons";
import { buttonClass } from "@/components/ui/button-class";
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
          canCreate && (
            <Link className={buttonClass("primary", "md")} href="/companias/nueva">
              <Plus aria-hidden="true" />
              Nueva compañía
            </Link>
          )
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

export default function CompaniasPage(props: PageProps<"/companias">) {
  return (
    <div className="stack">
      <PageHeader
        title="Compañías"
        actions={
          <Link className={buttonClass("primary", "md")} href="/companias/nueva">
            <Plus aria-hidden="true" />
            Nueva compañía
          </Link>
        }
      />
      <Suspense fallback={<Loading />}>
        <CompanyList searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
