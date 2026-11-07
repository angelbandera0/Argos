"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { NAV_ICONS } from "@/components/icons";
import { Avatar } from "@/components/ui/avatar";
import { buttonClass } from "@/components/ui/button-class";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityCard } from "@/components/ui/entity-card";
import { ListToolbar } from "@/components/ui/list-toolbar";
import type { PermissionSet } from "@/core/domain/permissions";
import { OPS, sessionLabel, usersLabel } from "./role-card-data";
import { RoleMenu } from "./role-menu";

const { KeyRound, Plus, Check } = NAV_ICONS;

export type RoleCardRow = {
  id: string;
  name: string;
  companies: string[] | "all";
  products: PermissionSet;
  sessionSeconds: number | null;
  users: string[];
};

export function RoleList({
  rows,
  q,
  companyId,
  companies,
}: {
  rows: RoleCardRow[];
  q: string;
  companyId: string;
  companies: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const go = (compania: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (compania) p.set("compania", compania);
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <>
      <ListToolbar
        className="ui-companies-bar"
        submitLabel={false}
        search={{ label: "Buscar rol", placeholder: "Buscar por nombre", defaultValue: q }}
        extra={
          <>
            {companyId && <input type="hidden" name="compania" value={companyId} />}
            {companies.length > 0 && (
              <>
                <span className="ui-toolbar-sep" aria-hidden="true" />
                <div className="ui-toolbar-chips" role="group" aria-label="Compañía">
                  <Chip pressed={companyId === ""} onPressedChange={() => go("")}>
                    Todas las compañías
                  </Chip>
                  {companies.map((c) => (
                    <Chip key={c.id} pressed={companyId === c.id} onPressedChange={() => go(c.id)}>
                      {c.name}
                    </Chip>
                  ))}
                </div>
              </>
            )}
            <div className="ui-toolbar-end">
              <span className="caption">{rows.length} {rows.length === 1 ? "rol" : "roles"}</span>
            </div>
          </>
        }
      />
      {rows.length === 0 ? (
        <EmptyState icon="Search" title="Ningún rol coincide con la búsqueda.">
          Prueba con otro nombre o compañía.
        </EmptyState>
      ) : (
        <div className="ui-entity-card-grid">
          {rows.map((r) => (
            <EntityCard
              key={r.id}
              avatar={<KeyRound />}
              avatarClassName="co-tone-1"
              title={<Link href={`/roles/${r.id}`}>{r.name}</Link>}
              badge={<RoleMenu roleId={r.id} name={r.name} />}
              actions={
                <Link href={`/roles/${r.id}`} className={`${buttonClass("outline", "md")} ui-entity-card-edit`}>
                  Editar rol
                </Link>
              }
            >
              <dl className="ui-role-data">
                <div>
                  <dt>Compañías</dt>
                  <dd className="ui-role-chips">
                    {r.companies === "all" ? (
                      <Chip variant="neutral">Todas las compañías</Chip>
                    ) : r.companies.length === 0 ? (
                      "—"
                    ) : (
                      r.companies.map((c) => (
                        <Chip key={c} variant="ring">
                          {c}
                        </Chip>
                      ))
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Permisos · Productos</dt>
                  <dd className="ui-role-chips">
                    {OPS.map(({ op, label }) =>
                      r.products[op] ? (
                        <Chip key={op} variant="alert">
                          <Check aria-hidden="true" />
                          {label}
                        </Chip>
                      ) : (
                        <Chip key={op} className="ui-role-denied">
                          {label}
                          <span className="sr-only"> (no permitido)</span>
                        </Chip>
                      ),
                    )}
                  </dd>
                </div>
                <div className="ui-role-pair">
                  <div>
                    <dt>Sesión</dt>
                    <dd>{sessionLabel(r.sessionSeconds)}</dd>
                  </div>
                  <div>
                    <dt>Usuarios</dt>
                    <dd className="ui-role-users">
                      {r.users.length > 0 && (
                        <span className="ui-avatar-stack">
                          {r.users.slice(0, 3).map((u) => (
                            <Avatar key={u} name={u} size="sm" />
                          ))}
                        </span>
                      )}
                      {usersLabel(r.users.length)}
                    </dd>
                  </div>
                </div>
              </dl>
            </EntityCard>
          ))}
          <Link href="/roles/nuevo" className="ui-role-new">
            <span className="ui-role-new-icon" aria-hidden="true">
              <Plus />
            </span>
            <strong>Crear un rol nuevo</strong>
            <span className="caption">Define qué puede hacer cada persona.</span>
          </Link>
        </div>
      )}
    </>
  );
}
