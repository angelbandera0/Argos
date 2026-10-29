import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Settings } from "lucide-react";
import { Power, Users } from "@/components/icons";
import { companyInitials, avatarTone } from "@/components/org/company-avatar";
import { CompanySettingsButton } from "@/components/org/company-settings-dialog";
import { DeactivateDialog } from "@/components/org/deactivate-dialog";
import { REASON_LABELS } from "@/components/org/reasons";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button-class";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Chip } from "@/components/ui/chip";
import { StatTile } from "@/components/ui/stat-tile";
import type { ReasonCode } from "@/core/domain/deactivation";
import { requireOrgUser } from "../guard";
import Loading from "./loading";
import { SitesSection, type SiteCardData } from "./sites-section";
import { UnitMenu } from "./unit-menu";

export const instant = false;

export const metadata: Metadata = { title: "Compañía · Argos" };

function StatusBadge({ status }: { status: "active" | "inactive" }) {
  return status === "active" ? <Badge variant="success">Activa</Badge> : <Badge variant="danger">Desactivada</Badge>;
}

async function CompanyDetail({ params }: { params: PageProps<"/companias/[id]">["params"] }) {
  const { id } = await params;
  const { supabase, actor, org } = await requireOrgUser();
  const company = await org.companies.getById(id);
  if (!company) notFound();

  const sites = await org.sites.listByParent(id);
  const stores = await Promise.all(sites.map((s) => org.stores.listByParent(s.id)));
  const canManage = actor.kind === "superadmin" || company.founderId === actor.userId;
  const canCreate = actor.kind === "admin";
  const canRename = actor.kind === "superadmin" || (actor.kind === "admin" && (await org.companies.listAdmins(id)).includes(actor.userId));
  const renameReason = canRename ? undefined : "Solo un administrador con acceso o el superadmin pueden renombrar.";
  const off = company.status === "inactive";

  const founder = canManage ? null : await org.users.getProfile(company.founderId);
  const disabledReason = canManage
    ? undefined
    : `Solo el fundador o el superadmin pueden ${off ? "reactivarla" : "desactivarla"}. El fundador es ${founder?.displayName ?? "otro administrador"}.`;

  const unitReason = (active: boolean) =>
    canManage
      ? undefined
      : `Solo el fundador o el superadmin pueden ${active ? "desactivar" : "reactivar"} sedes y tiendas.`;

  const adminIds = await org.companies.listAdmins(id);
  const admins = (await Promise.all(adminIds.map((a) => org.users.getProfile(a))))
    .flatMap((p) => (p ? [p.displayName] : []));

  const { data } = off
    ? await supabase
        .from("companies")
        .select("status_reason_code, status_reason_text, status_changed_by, status_changed_at")
        .eq("id", id)
        .maybeSingle()
    : { data: null };
  const code = data?.status_reason_code as ReasonCode | undefined;
  const reasonText = data?.status_reason_text as string | undefined;
  const changedBy = data?.status_changed_by ? await org.users.getProfile(data.status_changed_by as string) : null;
  const changedAt = data?.status_changed_at
    ? new Intl.DateTimeFormat("es", { dateStyle: "long", timeStyle: "short" }).format(new Date(data.status_changed_at as string))
    : null;

  const allStores = stores.flat();
  const activeStores = allStores.filter((t) => t.status === "active").length;
  const cards: SiteCardData[] = sites.map((s, i) => ({
    id: s.id,
    name: s.name,
    active: s.status === "active",
    menu: (
      <UnitMenu
        companyId={id}
        level="site"
        id={s.id}
        name={s.name}
        active={s.status === "active"}
        canCreate={canCreate}
        canManage={canManage}
        canRename={canRename}
        renameReason={renameReason}
        disabledReason={unitReason(s.status === "active")}
      />
    ),
    stores: stores[i].map((t) => ({
      id: t.id,
      name: t.name,
      badge: <StatusBadge status={t.status} />,
      menu: (
        <UnitMenu
          companyId={id}
          level="store"
          id={t.id}
          name={t.name}
          active={t.status === "active"}
          canCreate={false}
          canManage={canManage}
          canRename={canRename}
          renameReason={renameReason}
          disabledReason={unitReason(t.status === "active")}
        />
      ),
    })),
  }));

  return (
    <div className="stack">
      <header className="page-header">
        <Breadcrumbs items={[{ label: "Compañías", href: "/companias" }, { label: company.name }]} />
        <div className="page-header-row">
          <div className="ui-company-head">
            <span className={`ui-entity-card-avatar co-tone-${off ? "none" : avatarTone(company.code) % 2}`} aria-hidden="true">
              {companyInitials(company.name)}
            </span>
            <div className="ui-company-id">
              <h1 className="page-title">{company.name}</h1>
              <div className="row ui-company-meta">
                <Chip variant="ring" className="mono">
                  {company.code}
                </Chip>
                <StatusBadge status={company.status} />
                {admins.length > 0 && <span className="caption">Administra: {admins.join(", ")}</span>}
              </div>
            </div>
          </div>
          <span className="spacer" />
          <div className="page-header-actions">
            <Link className={buttonClass("outline", "sm")} href={`/companias/${id}/administradores`}>
              Administradores
              <Users aria-hidden="true" />
            </Link>
            {actor.kind === "admin" && (
              <CompanySettingsButton
                companyId={id}
                name={company.name}
                hours={company.sessionCapSeconds / 3600}
                label="Ajustes"
                variant="outline"
                size="sm"
                icon={<Settings aria-hidden="true" />}
              />
            )}
          </div>
        </div>
      </header>

      <div className="ui-stat-grid">
        <StatTile icon="Building2" label="Sedes" value={sites.length} />
        <StatTile icon="Box" label="Tiendas" value={allStores.length} />
        <StatTile icon="ShieldCheck" label="Tiendas activas" value={activeStores} />
        <StatTile icon="Calendar" label="Tope de sesión" value={`${company.sessionCapSeconds / 3600} h`} />
      </div>

      {off && (
        <Alert variant="danger" title={code ? REASON_LABELS[code] : "Desactivada"}>
          {reasonText ? `${reasonText}. ` : ""}
          {changedBy || changedAt
            ? `Desactivada${changedBy ? ` por ${changedBy.displayName}` : ""}${changedAt ? ` el ${changedAt}` : ""}. `
            : ""}
          Mientras tanto nadie puede entrar a sus sedes y tiendas.
        </Alert>
      )}

      <SitesSection companyId={id} sites={cards} canCreate={canCreate} />

      <section className="ui-danger-zone" aria-labelledby="h-peligro">
        <span className="ui-danger-zone-icon" aria-hidden="true">
          <Power />
        </span>
        <div className="ui-danger-zone-text">
          <h2 id="h-peligro">{off ? "Reactivar compañía" : "Desactivar compañía"}</h2>
          <p className="muted">
            {off
              ? "La compañía está desactivada y sus tiendas no pueden vender. Solo el fundador o el superadmin pueden reactivarla; se te pedirá un motivo."
              : `Al desactivarla, ${activeStores === 1 ? "su tienda activa deja" : `sus ${activeStores} tiendas activas dejan`} de vender. Solo el fundador o el superadmin pueden hacerlo.`}
          </p>
        </div>
        <div className="stack">
          <DeactivateDialog
            level="company"
            id={id}
            name={company.name}
            mode={off ? "reactivate" : "deactivate"}
            disabledReason={disabledReason}
          />
        </div>
      </section>
    </div>
  );
}

export default function CompanyPage(props: PageProps<"/companias/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <CompanyDetail params={props.params} />
    </Suspense>
  );
}
