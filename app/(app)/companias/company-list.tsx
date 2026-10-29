"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button-class";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityCard } from "@/components/ui/entity-card";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { avatarTone, companyInitials } from "@/components/org/company-avatar";
import { CompanySettingsButton } from "@/components/org/company-settings-dialog";
import { CompanyTable } from "./company-table";
import type { StatusFilter } from "./company-filters";

export type CompanyCardRow = { id: string; name: string; code: string; status: "active" | "inactive"; hours: number };

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "activas", label: "Activas" },
  { value: "inactivas", label: "Inactivas" },
];

export function CompanyList({
  rows,
  q,
  status,
  view,
  counts,
  activeId,
  canEdit,
}: {
  rows: CompanyCardRow[];
  q: string;
  status: StatusFilter;
  view: ViewMode;
  counts: Record<StatusFilter, number>;
  activeId?: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const go = (next: { estado?: StatusFilter; vista?: ViewMode }) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    const estado = next.estado ?? status;
    const vista = next.vista ?? view;
    if (estado !== "todas") p.set("estado", estado);
    if (vista === "lista") p.set("vista", "lista");
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <>
      <ListToolbar
        submitLabel={false}
        search={{ label: "Buscar compañía", placeholder: "Buscar por nombre o código", defaultValue: q }}
        extra={
          <>
            {status !== "todas" && <input type="hidden" name="estado" value={status} />}
            {view === "lista" && <input type="hidden" name="vista" value="lista" />}
            <div className="list-toolbar-filter" role="group" aria-label="Estado">
              {FILTERS.map((f) => (
                <Chip key={f.value} pressed={status === f.value} onPressedChange={() => go({ estado: f.value })}>
                  {f.label} · {counts[f.value]}
                </Chip>
              ))}
            </div>
            <ViewToggle value={view} onValueChange={(vista) => go({ vista })} />
          </>
        }
      />
      {rows.length === 0 ? (
        <EmptyState icon="Search" title="Ninguna compañía coincide con la búsqueda.">
          Prueba con otro nombre o código.
        </EmptyState>
      ) : view === "lista" ? (
        <CompanyTable rows={rows} />
      ) : (
        <div className="ui-entity-card-grid">
          {rows.map((c) => (
            <EntityCard
              key={c.id}
              inactive={c.status !== "active"}
              avatar={<span className={`co-tone-${avatarTone(c.code)}`}>{companyInitials(c.name)}</span>}
              title={<Link href={`/companias/${c.id}`}>{c.name}</Link>}
              code={c.code}
              chip={c.id === activeId ? <Chip variant="warning">En uso</Chip> : undefined}
              badge={c.status === "active" ? <Badge variant="success">Activa</Badge> : <Badge variant="danger">Desactivada</Badge>}
              data={[{ label: "Tope de sesión", value: `${c.hours} h` }]}
              actions={
                <>
                  <Link href={`/companias/${c.id}`} className={buttonClass("outline", "md")}>
                    Ver compañía
                  </Link>
                  {canEdit && (
                    <CompanySettingsButton
                      companyId={c.id}
                      name={c.name}
                      hours={c.hours}
                      label="Editar"
                      variant="outline"
                      className="ui-entity-card-edit"
                    />
                  )}
                </>
              }
            />
          ))}
        </div>
      )}
    </>
  );
}
