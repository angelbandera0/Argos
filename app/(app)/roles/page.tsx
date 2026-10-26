import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "@/components/icons";
import { RoleTable } from "@/components/roles/role-table";
import { buttonClass } from "@/components/ui/button-class";
import { EmptyState } from "@/components/ui/empty-state";
import { ListToolbar } from "@/components/ui/list-toolbar";
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

async function RoleList({ searchParams }: { searchParams: PageProps<"/roles">["searchParams"] }) {
  const { actor, roles } = await requireRoleUser();
  const { q } = await searchParams;
  const query = (typeof q === "string" ? q : "").trim().toLowerCase();
  const all = await roles.listRoles(actor);
  const shown = all.filter((r) => r.name.toLowerCase().includes(query));

  if (all.length === 0) {
    return (
      <EmptyState icon="KeyRound" title="Aún no tienes roles." action={<NewRoleLink />}>
        Crea el primero para asignarlo a tus operadores.
      </EmptyState>
    );
  }

  return (
    <>
      <ListToolbar
        search={{ label: "Buscar rol", placeholder: "Buscar por nombre", defaultValue: typeof q === "string" ? q : undefined }}
      />
      <RoleTable rows={shown.map((r) => ({ id: r.id, name: r.name, excluded: r.excludedCompanyIds.length }))} />
    </>
  );
}

export default function RolesPage(props: PageProps<"/roles">) {
  return (
    <div className="stack">
      <PageHeader title="Roles" actions={<NewRoleLink />} />
      <Suspense fallback={<Loading />}>
        <RoleList searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
