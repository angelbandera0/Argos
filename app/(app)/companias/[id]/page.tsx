import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Store } from "@/components/icons";
import { CompanySettingsButton } from "@/components/org/company-settings-dialog";
import { DeactivateDialog } from "@/components/org/deactivate-dialog";
import { REASON_LABELS } from "@/components/org/reasons";
import { Accordion } from "@/components/ui/accordion";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button-class";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { PageHeader } from "@/components/ui/page-header";
import type { ReasonCode } from "@/core/domain/deactivation";
import { requireOrgUser } from "../guard";
import Loading from "./loading";
import { NewUnit } from "./new-unit";
import { UnitMenu } from "./unit-menu";

export const instant = false;

export const metadata: Metadata = { title: "Compañía · Argos" };

const count = (n: number) => `${n} ${n === 1 ? "tienda" : "tiendas"}`;

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
  const off = company.status === "inactive";

  const founder = canManage ? null : await org.users.getProfile(company.founderId);
  const disabledReason = canManage
    ? undefined
    : `Solo el fundador o el superadmin pueden ${off ? "reactivarla" : "desactivarla"}. El fundador es ${founder?.displayName ?? "otro administrador"}.`;

  const unitReason = (active: boolean) =>
    canManage
      ? undefined
      : `Solo el fundador o el superadmin pueden ${active ? "desactivar" : "reactivar"} sedes y tiendas.`;

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

  return (
    <div className="stack">
      <PageHeader
        title={company.name}
        breadcrumbs={[{ label: "Compañías", href: "/companias" }, { label: company.name }]}
        description={
          <span className="row">
            <Chip variant="ring" className="mono">
              {company.code}
            </Chip>
            <StatusBadge status={company.status} />
          </span>
        }
        actions={
          <>
            <Link className={buttonClass("secondary", "md")} href={`/companias/${id}/administradores`}>
              Administradores
            </Link>
            {actor.kind === "admin" && (
              <CompanySettingsButton companyId={id} name={company.name} hours={company.sessionCapSeconds / 3600} />
            )}
          </>
        }
      />

      {off && (
        <Alert variant="danger" title={code ? REASON_LABELS[code] : "Desactivada"}>
          {reasonText ? `${reasonText}. ` : ""}
          {changedBy || changedAt
            ? `Desactivada${changedBy ? ` por ${changedBy.displayName}` : ""}${changedAt ? ` el ${changedAt}` : ""}. `
            : ""}
          Mientras tanto nadie puede entrar a sus sedes y tiendas.
        </Alert>
      )}

      <Card aria-labelledby="h-est">
        <div className="card-head">
          <h2 className="h2" id="h-est">
            Sedes y tiendas
          </h2>
          <span className="spacer" />
          {canCreate && <NewUnit companyId={id} />}
        </div>
        {sites.length === 0 ? (
          <p className="muted">Aún no hay sedes. Crea la primera para poder agregar tiendas.</p>
        ) : (
          <Accordion
            variant="rich"
            multiple
            aria-label="Sedes y tiendas"
            defaultValue={sites.map((s) => s.id)}
            items={sites.map((s, i) => ({
              value: s.id,
              icon: "Building2",
              title: s.name,
              subtitle: count(stores[i].length),
              badge: <StatusBadge status={s.status} />,
              action: (
                <UnitMenu
                  companyId={id}
                  level="site"
                  id={s.id}
                  name={s.name}
                  active={s.status === "active"}
                  canCreate={canCreate}
                  canManage={canManage}
                  disabledReason={unitReason(s.status === "active")}
                />
              ),
              content:
                stores[i].length === 0 ? (
                  <p className="muted">Aún no hay tiendas en esta sede.</p>
                ) : (
                  <ul className="list" aria-label={`Tiendas de ${s.name}`}>
                    {stores[i].map((t) => (
                      <li key={t.id} className="list-row tree-row">
                        <span className="row">
                          <span className="icon-dot" aria-hidden="true">
                            <Store />
                          </span>
                          <strong>{t.name}</strong>
                        </span>
                        <span className="row">
                          <StatusBadge status={t.status} />
                          <UnitMenu
                            companyId={id}
                            level="store"
                            id={t.id}
                            name={t.name}
                            active={t.status === "active"}
                            canCreate={false}
                            canManage={canManage}
                            disabledReason={unitReason(t.status === "active")}
                          />
                        </span>
                      </li>
                    ))}
                  </ul>
                ),
            }))}
          />
        )}
      </Card>

      <Card aria-labelledby="h-estado">
        <h2 className="h2" id="h-estado">
          Estado de la compañía
        </h2>
        <p className="muted">
          {off
            ? "La compañía está desactivada. Solo el fundador o el superadmin pueden reactivarla; se te pedirá un motivo."
            : "La compañía está operando con normalidad. Solo el fundador o el superadmin pueden desactivarla."}
        </p>
        <div className="row">
          <DeactivateDialog
            level="company"
            id={id}
            name={company.name}
            mode={off ? "reactivate" : "deactivate"}
            disabledReason={disabledReason}
          />
        </div>
      </Card>
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
