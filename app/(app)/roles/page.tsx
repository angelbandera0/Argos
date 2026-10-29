import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "@/components/icons";
import { allowedCompanies, parseCompanyFilter } from "@/components/roles/role-card-data";
import { RoleList } from "@/components/roles/role-list";
import { buttonClass } from "@/components/ui/button-class";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireRoleUser } from "./guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Roles · Argos" };

const NewRoleLink = () => (
  <Link className={buttonClass("primary", "md")} href="/roles/nuevo">
    <Plus aria-hidden="true" />
    Nuevo rol
  </Link>
);

async function RoleListContent({ searchParams }: { searchParams: PageProps<"/roles">["searchParams"] }) {
  const { actor, roles, org } = await requireRoleUser();
  const { q, compania } = await searchParams;
  const text = typeof q === "string" ? q : "";
  const query = text.trim().toLowerCase();
  const [all, companies] = await Promise.all([roles.listRoles(actor), org.listCompanies(actor)]);

  if (all.length === 0) {
    return (
      <EmptyState icon="KeyRound" title="Aún no tienes roles." action={<NewRoleLink />}>
        Crea el primero para asignarlo a tus operadores.
      </EmptyState>
    );
  }

  const companyId = parseCompanyFilter(compania, companies.map((c) => c.id));
  const shown = all.filter((r) => r.name.toLowerCase().includes(query) && (!companyId || !r.excludedCompanyIds.includes(companyId)));
  const assigned = await roles.roles.listUsers(shown.map((r) => r.id));

  return (
    <RoleList
      q={text}
      companyId={companyId}
      companies={companies.map((c) => ({ id: c.id, name: c.name }))}
      rows={shown.map((r) => ({
        id: r.id,
        name: r.name,
        companies: r.excludedCompanyIds.length === 0 ? "all" : allowedCompanies(companies, r.excludedCompanyIds).map((c) => c.name),
        products: r.permissions.products,
        sessionSeconds: r.sessionSeconds,
        users: assigned.filter((u) => u.roleId === r.id).map((u) => u.displayName),
      }))}
    />
  );
}

export default function RolesPage(props: PageProps<"/roles">) {
  return (
    <div className="stack">
      <PageHeader title="Roles" description="Qué puede hacer cada persona y en qué compañías." actions={<NewRoleLink />} />
      <Suspense fallback={<Loading />}>
        <RoleListContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
