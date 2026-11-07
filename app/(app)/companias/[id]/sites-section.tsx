"use client";

import { useState } from "react";
import { Building2, Plus, Search } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { EntityCard } from "@/components/ui/entity-card";
import { EntityPanel, type EntityPanelRow } from "@/components/ui/entity-panel";
import { Input } from "@/components/ui/input";
import { NewUnit, NewUnitDialog } from "./new-unit";
import { filterSites } from "./sites-filter";

export type SiteCardData = {
  id: string;
  name: string;
  active: boolean;
  stores: (EntityPanelRow & { name: string })[];
  menu: React.ReactNode;
};

const status = (active: boolean) =>
  active ? <Badge variant="success">Activa</Badge> : <Badge variant="danger">Desactivada</Badge>;

function AddStore({ companyId, site }: { companyId: string; site: SiteCardData }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        <Plus aria-hidden="true" />
        Añadir tienda
      </Button>
      {open && <NewUnitDialog companyId={companyId} siteId={site.id} siteName={site.name} onClose={() => setOpen(false)} />}
    </>
  );
}

export function SitesSection({ companyId, sites, canCreate }: { companyId: string; sites: SiteCardData[]; canCreate: boolean }) {
  const [q, setQ] = useState("");
  const shown = filterSites(sites, q);
  return (
    <section className="stack" aria-labelledby="h-sedes">
      <div className="ui-sites-head">
        <h2 className="h2" id="h-sedes">
          Sedes y tiendas
          <span className="caption">
            · {sites.length} {sites.length === 1 ? "sede" : "sedes"}
          </span>
        </h2>
        <form className="search" role="search" onSubmit={(e) => e.preventDefault()}>
          <label className="sr-only" htmlFor="q-search">
            Buscar sede o tienda
          </label>
          <Search aria-hidden="true" />
          <Input
            id="q-search"
            name="q"
            type="search"
            variant="outline"
            placeholder="Buscar sede o tienda"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>
        {canCreate && <NewUnit companyId={companyId} />}
      </div>
      {sites.length === 0 ? (
        <EmptyState icon="Building2" title="Aún no hay sedes.">
          Crea la primera para poder agregar tiendas.
        </EmptyState>
      ) : shown.length === 0 ? (
        <EmptyState icon="Search" title={`Nada coincide con "${q}".`}>
          Busca por nombre de sede o de tienda.
        </EmptyState>
      ) : (
        <div className="ui-entity-card-grid" style={{ ["--ui-card-min" as string]: "420px" }}>
          {shown.map((s) => (
            <EntityCard
              key={s.id}
              inactive={!s.active}
              avatar={<Building2 />}
              avatarClassName="co-tone-1"
              title={s.name}
              subtitle={`${s.stores.length} ${s.stores.length === 1 ? "tienda" : "tiendas"}`}
              badge={
                <>
                  {status(s.active)}
                  {s.menu}
                </>
              }
            >
              <EntityPanel
                title="Tiendas"
                rows={s.stores}
                empty="Esta sede aún no tiene tiendas."
                action={canCreate ? <AddStore companyId={companyId} site={s} /> : undefined}
              />
            </EntityCard>
          ))}
        </div>
      )}
    </section>
  );
}
