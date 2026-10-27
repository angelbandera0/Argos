import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "@/components/icons";
import { UserTable } from "@/components/users/user-table";
import { buttonClass } from "@/components/ui/button-class";
import { EmptyState } from "@/components/ui/empty-state";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { requireUserAdmin } from "./guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Usuarios · Argos" };

const STATUS = { active: "Activo", locked: "Bloqueado", deactivated: "Desactivado" } as const;
const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  ...Object.entries(STATUS).map(([value, label]) => ({ value, label })),
];

const NewUserLink = () => (
  <Link className={buttonClass("primary", "md")} href="/usuarios/nuevo">
    <Plus aria-hidden="true" />
    Nuevo usuario
  </Link>
);

async function UserList({ searchParams }: { searchParams: PageProps<"/usuarios">["searchParams"] }) {
  const { users, company } = await requireUserAdmin();
  if (!company) {
    return <EmptyState icon="Users" title="Elige una compañía arriba para ver sus usuarios." />;
  }
  const { q, estado } = await searchParams;
  const qs = typeof q === "string" ? q : "";
  const query = qs.trim().toLowerCase();
  const status = typeof estado === "string" && estado in STATUS ? estado : "";
  const all = await users.users.listForCompany(company.id);
  const shown = all.filter(
    (u) =>
      (!status || u.status === status) &&
      (u.displayName.toLowerCase().includes(query) || (u.username ?? "").includes(query)),
  );

  if (all.length === 0) {
    return (
      <EmptyState icon="Users" title={`Aún no hay usuarios en ${company.name}.`} action={<NewUserLink />}>
        Crea el primero para que pueda entrar con su PIN.
      </EmptyState>
    );
  }

  return (
    <>
      <ListToolbar
        search={{ label: "Buscar usuario", placeholder: "Buscar por nombre o usuario", defaultValue: qs }}
        filters={[{ name: "estado", label: "Estado", options: STATUS_OPTIONS, defaultValue: status }]}
      />
      <UserTable
        rows={shown.map((u) => ({ id: u.id, displayName: u.displayName, username: u.username, status: u.status }))}
      />
    </>
  );
}

export default function UsersPage(props: PageProps<"/usuarios">) {
  return (
    <div className="stack">
      <PageHeader title="Usuarios" actions={<NewUserLink />} />
      <Suspense fallback={<Loading />}>
        <UserList searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
