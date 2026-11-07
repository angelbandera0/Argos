"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { type Column, DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterSelect } from "@/components/ui/filter-select";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pager } from "@/components/ui/pager";
import { type Kind, UserActionDialogs } from "./user-actions";
import { type StateFilter, type UserState, userListQuery } from "./user-list-data";

export type UserListRow = {
  id: string;
  displayName: string;
  username: string | null;
  role: string | null;
  stores: { all: boolean; first?: string; more: number };
  lastAccess: string;
  state: UserState;
};

export type UserListFilters = { q: string; rol: string; tienda: string; estado: StateFilter; pagina: number };

const STATE_BADGE = {
  active: { label: "Activo", variant: "success" },
  never: { label: "Aún no ha entrado", variant: "warning" },
  locked: { label: "Bloqueado", variant: "danger" },
  inactive: { label: "Inactivo", variant: "neutral" },
} as const;

const columns: Column<UserListRow>[] = [
  {
    id: "user",
    header: "Usuario",
    cell: (u) => (
      <div className="ui-user-cell">
        <Avatar name={u.displayName} toneKey={u.role ?? undefined} size="md" className={u.state === "inactive" ? "ui-avatar-dim" : undefined} />
        <Link href={`/usuarios/${u.id}`}>{u.displayName}</Link>
      </div>
    ),
  },
  {
    id: "username",
    header: "Nombre de usuario",
    cell: (u) => {
      const [prefix, ...rest] = (u.username ?? "").split(".");
      return u.username ? (
        <span className="ui-username mono">
          <span className="ui-username-prefix">{prefix}.</span>
          {rest.join(".")}
        </span>
      ) : null;
    },
  },
  {
    id: "role",
    header: "Rol",
    cell: (u) =>
      u.role ? <Chip variant={u.role.toLowerCase() === "administrador" ? "warning" : "alert"}>{u.role}</Chip> : "—",
  },
  {
    id: "stores",
    header: "Tiendas",
    cell: (u) =>
      u.stores.all ? (
        <Chip>Todas las tiendas</Chip>
      ) : u.stores.first ? (
        <span className="ui-user-stores">
          <Chip variant="ring">{u.stores.first}</Chip>
          {u.stores.more > 0 && <Chip>+{u.stores.more}</Chip>}
        </span>
      ) : (
        "—"
      ),
  },
  { id: "access", header: "Último acceso", cell: (u) => u.lastAccess },
  {
    id: "state",
    header: "Estado",
    cell: (u) => <Badge variant={STATE_BADGE[u.state].variant}>{STATE_BADGE[u.state].label}</Badge>,
  },
];

export function UserList({
  rows,
  total,
  filters,
  roles,
  stores,
  counts,
  pageSize,
}: {
  rows: UserListRow[];
  total: number;
  filters: UserListFilters;
  roles: { value: string; label: string }[];
  stores: { value: string; label: string }[];
  counts: Record<StateFilter, number>;
  pageSize: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [action, setAction] = useState<{ id: string; name: string; kind: Kind } | null>(null);
  const go = (patch: Partial<UserListFilters>) => {
    const next = { ...filters, pagina: 1, ...patch };
    router.replace(`${pathname}${userListQuery(next)}`, { scroll: false });
  };
  const chips: { value: StateFilter; label: string }[] = [
    { value: "todos", label: "Todos" },
    { value: "activos", label: "Activos" },
    ...(counts.bloqueados > 0 ? [{ value: "bloqueados" as const, label: "Bloqueados" }] : []),
    { value: "inactivos", label: "Inactivos" },
  ];

  return (
    <>
      <ListToolbar
        className="ui-companies-bar"
        submitLabel={false}
        search={{ label: "Buscar usuario", placeholder: "Buscar por nombre o usuario", defaultValue: filters.q }}
        extra={
          <>
            {filters.rol && <input type="hidden" name="rol" value={filters.rol} />}
            {filters.tienda && <input type="hidden" name="tienda" value={filters.tienda} />}
            {filters.estado !== "todos" && <input type="hidden" name="estado" value={filters.estado} />}
            <FilterSelect label="Rol" emptyText="Todos" options={roles} value={filters.rol} onValueChange={(rol) => go({ rol })} />
            <FilterSelect label="Tienda" emptyText="Todas" options={stores} value={filters.tienda} onValueChange={(tienda) => go({ tienda })} />
            <span className="ui-toolbar-sep" aria-hidden="true" />
            <div className="ui-toolbar-chips" role="group" aria-label="Estado">
              {chips.map((c) => (
                <Chip key={c.value} pressed={filters.estado === c.value} onPressedChange={() => go({ estado: c.value })}>
                  {c.label}
                  <span className="ui-chip-count">{counts[c.value]}</span>
                </Chip>
              ))}
            </div>
          </>
        }
      />
      <div className="stack">
        <DataTable
          label="Usuarios"
          columns={columns}
          rows={rows}
          getRowId={(u) => u.id}
          rowActionsLabel={(id) => `Opciones de ${rows.find((r) => r.id === id)?.displayName ?? "usuario"}`}
          rowActions={(u) =>
            u.state === "inactive"
              ? [{ label: "Editar", onSelect: () => router.push(`/usuarios/${u.id}`) }]
              : [
                  { label: "Editar", onSelect: () => router.push(`/usuarios/${u.id}`) },
                  { label: "Generar nuevo PIN", onSelect: () => setAction({ id: u.id, name: u.displayName, kind: "reset" }) },
                  { label: "Desactivar usuario", destructive: true, onSelect: () => setAction({ id: u.id, name: u.displayName, kind: "deactivate" }) },
                ]
          }
          empty={
            <EmptyState icon="Search" title="Ningún usuario coincide con la búsqueda.">
              Prueba con otro nombre o quita algún filtro.
            </EmptyState>
          }
        />
        {total > 0 && (
          <div className="ui-user-foot">
            <Pager page={filters.pagina} pageSize={pageSize} total={total} unit={total === 1 ? "usuario" : "usuarios"} onPageChange={(pagina) => go({ pagina })} />
          </div>
        )}
      </div>
      {action && <UserActionDialogs userId={action.id} name={action.name} kind={action.kind} onClose={() => setAction(null)} />}
    </>
  );
}
