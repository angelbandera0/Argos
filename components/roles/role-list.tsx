"use client";

import { useNavRouter } from "@/components/ui/use-nav-router";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ICONS } from "@/components/icons";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityCard } from "@/components/ui/entity-card";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { roleCardData } from "./role-card-data";
import { RoleMenu } from "./role-menu";

const { KeyRound } = NAV_ICONS;

export type RoleCardRow = {
  id: string;
  name: string;
  companies: string[] | "all";
  sessionSeconds: number | null;
  usersCount: number;
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
  const router = useNavRouter();
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
              className="ui-role-card"
              avatar={<KeyRound />}
              avatarClassName="co-tone-1"
              title={<Link href={`/roles/${r.id}`}>{r.name}</Link>}
              badge={<RoleMenu roleId={r.id} name={r.name} />}
              data={roleCardData(r)}
            />
          ))}
        </div>
      )}
    </>
  );
}
