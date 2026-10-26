import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Building2, Check, Store } from "@/components/icons";
import { DeactivateDialog } from "@/components/org/deactivate-dialog";
import { REASON_LABELS } from "@/components/org/reasons";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import type { ReasonCode } from "@/core/domain/deactivation";
import { requireOrgUser } from "../guard";
import Loading from "./loading";
import { NewUnit } from "./new-unit";

export const instant = false;

export const metadata: Metadata = { title: "Compañía · Argos" };

const count = (n: number) => `${n} ${n === 1 ? "tienda" : "tiendas"}`;

function StatusChip({ status }: { status: "active" | "inactive" }) {
  return status === "active" ? <Chip variant="ring">Activa</Chip> : <Chip variant="alert">Desactivada</Chip>;
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
      <div className="row">
        <h1 className="page-title">{company.name}</h1>
        <Chip variant="ring" className="mono">
          {company.code}
        </Chip>
        {off ? (
          <Chip variant="alert">Desactivada</Chip>
        ) : (
          <Chip>
            <Check aria-hidden="true" />
            Activa
          </Chip>
        )}
        <span className="spacer" />
        <Link className="btn btn-secondary" href={`/companias/${id}/administradores`}>
          Administradores
        </Link>
        {actor.kind === "admin" && (
          <Link className="btn btn-secondary" href={`/companias/${id}/ajustes`}>
            Ajustes
          </Link>
        )}
      </div>

      {off && (
        <div className="notice notice-alert" role="status">
          <p>
            <strong>{code ? REASON_LABELS[code] : "Desactivada"}.</strong>
            {reasonText ? ` ${reasonText}.` : ""}
            {changedBy || changedAt
              ? ` Desactivada${changedBy ? ` por ${changedBy.displayName}` : ""}${changedAt ? ` el ${changedAt}` : ""}.`
              : ""}{" "}
            Mientras tanto nadie puede entrar a sus sedes y tiendas.
          </p>
        </div>
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
          <ul className="list" aria-label="Sedes y tiendas">
            {sites.map((s, i) => (
              <li key={s.id} className="tree-group">
                <div className="list-row tree-row">
                  <span className="row">
                    <span className="icon-dot" aria-hidden="true">
                      <Building2 />
                    </span>
                    <span>
                      <strong>{s.name}</strong>
                      <br />
                      <span className="hint">{count(stores[i].length)}</span>
                    </span>
                  </span>
                  <span className="row">
                    <StatusChip status={s.status} />
                    {canCreate && <NewUnit companyId={id} siteId={s.id} siteName={s.name} />}
                    {canManage && (
                      <DeactivateDialog
                        compact
                        level="site"
                        id={s.id}
                        name={s.name}
                        mode={s.status === "active" ? "deactivate" : "reactivate"}
                      />
                    )}
                  </span>
                </div>
                {stores[i].map((t) => (
                  <div key={t.id} className="list-row tree-row tree-child">
                    <span className="row">
                      <span className="icon-dot" aria-hidden="true">
                        <Store />
                      </span>
                      <strong>{t.name}</strong>
                    </span>
                    <span className="row">
                      <StatusChip status={t.status} />
                      {canManage && (
                        <DeactivateDialog
                          compact
                          level="store"
                          id={t.id}
                          name={t.name}
                          mode={t.status === "active" ? "deactivate" : "reactivate"}
                        />
                      )}
                    </span>
                  </div>
                ))}
              </li>
            ))}
          </ul>
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
