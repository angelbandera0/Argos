"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button-class";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityCard } from "@/components/ui/entity-card";
import { FilterSelect } from "@/components/ui/filter-select";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { Pager } from "@/components/ui/pager";
import { ViewToggle, type ViewMode } from "@/components/ui/view-toggle";
import { avatarTone, companyInitials } from "@/components/org/company-avatar";
import { CompanySettingsButton } from "@/components/org/company-settings-dialog";
import { CompanyTable } from "./company-table";
import { PAGE_SIZE, type SortKey, type StatusFilter } from "./company-filters";
import type { CompanySummary } from "./company-summary";

export type CompanyCardRow = { id: string; name: string; code: string; status: "active" | "inactive"; hours: number; summary?: CompanySummary };

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "todas", label: "Todas" },
  { value: "activas", label: "Activas" },
  { value: "inactivas", label: "Inactivas" },
];

const SORTS = [
  { value: "codigo", label: "Código" },
  { value: "estado", label: "Estado" },
];

const tone = (code: string) => avatarTone(code) % 2;

export function CompanyList({
  rows,
  q,
  status,
  view,
  sort,
  page,
  total,
  counts,
  activeId,
  canEdit,
}: {
  rows: CompanyCardRow[];
  q: string;
  status: StatusFilter;
  view: ViewMode;
  sort: SortKey;
  page: number;
  total: number;
  counts: Record<StatusFilter, number>;
  activeId?: string;
  canEdit: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const go = (next: { estado?: StatusFilter; vista?: ViewMode; orden?: SortKey; pagina?: number }) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    const estado = next.estado ?? status;
    const vista = next.vista ?? view;
    if (estado !== "todas") p.set("estado", estado);
    const orden = next.orden ?? sort;
    if (vista === "lista") p.set("vista", "lista");
    if (orden !== "nombre") p.set("orden", orden);
    if (next.pagina && next.pagina > 1) p.set("pagina", String(next.pagina));
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  return (
    <>
      <ListToolbar
        className="ui-companies-bar"
        submitLabel={false}
        search={{ label: "Buscar compañía", placeholder: "Buscar por nombre o código", defaultValue: q }}
        extra={
          <>
            {status !== "todas" && <input type="hidden" name="estado" value={status} />}
            {view === "lista" && <input type="hidden" name="vista" value="lista" />}
            {sort !== "nombre" && <input type="hidden" name="orden" value={sort} />}
            <span className="ui-toolbar-sep" aria-hidden="true" />
            <div className="ui-toolbar-chips" role="group" aria-label="Estado">
              {FILTERS.map((f) => (
                <Chip key={f.value} pressed={status === f.value} onPressedChange={() => go({ estado: f.value })}>
                  {f.label}
                  <span className="ui-chip-count">{counts[f.value]}</span>
                </Chip>
              ))}
            </div>
            <div className="ui-toolbar-end">
              <FilterSelect
                label="Ordenar"
                emptyText="Nombre"
                options={SORTS}
                value={sort === "nombre" ? "" : sort}
                onValueChange={(v) => go({ orden: (v || "nombre") as SortKey })}
              />
              <ViewToggle value={view} onValueChange={(vista) => go({ vista })} />
            </div>
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
        <>
        <div className="ui-entity-card-grid">
          {rows.map((c) => (
            <EntityCard
              key={c.id}
              inactive={c.status !== "active"}
              avatar={companyInitials(c.name)}
              avatarClassName={`co-tone-${tone(c.code)}`}
              title={<Link href={`/companias/${c.id}`}>{c.name}</Link>}
              code={c.code}
              chip={c.id === activeId ? <Chip variant="warning">En uso</Chip> : undefined}
              badge={c.status === "active" ? <Badge variant="success">Activa</Badge> : <Badge variant="danger">Desactivada</Badge>}
              data={[
                { label: "Sedes", value: c.summary?.sites ?? "—" },
                { label: "Tiendas", value: c.summary?.stores ?? "—" },
                { label: "Administrador", value: c.summary?.admin ?? "—" },
                { label: "Tope de sesión", value: `${c.hours} h` },
              ]}
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
        <Pager page={page} pageSize={PAGE_SIZE} total={total} onPageChange={(pagina) => go({ pagina })} />
        </>
      )}
    </>
  );
}
