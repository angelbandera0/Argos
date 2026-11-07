import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requestBadge } from "@/components/requests/request-logic";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonClass } from "@/components/ui/button-class";
import { EntityCard } from "@/components/ui/entity-card";
import { parsePage } from "@/components/ui/page-param";
import { UrlPager } from "@/components/ui/url-pager";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { PageHeader } from "@/components/ui/page-header";
import { ViewState } from "@/components/ui/view-state";
import { Forbidden } from "@/core/domain/errors";
import { requireRequestUser } from "./guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Solicitudes · Argos" };

const NewLink = () => (
  <Link className={buttonClass("primary", "md")} href="/solicitudes/nueva">
    Nueva solicitud
  </Link>
);

const PAGE_SIZE = 20;

async function RequestsContent({ searchParams }: { searchParams: PageProps<"/solicitudes">["searchParams"] }) {
  const { actor, requests, companyId, canRequest } = await requireRequestUser();
  if (!companyId) return <ViewState kind="empty" entity="solicitudes" title="Elige una compañía arriba para ver sus solicitudes." canCreate={false} />;
  const page = parsePage((await searchParams).pagina);
  let list;
  try {
    list = await requests.listRequests(actor, { companyId, page, pageSize: PAGE_SIZE });
  } catch (e) {
    if (e instanceof Forbidden) return <ViewState kind="forbidden" entity="solicitudes" permission="Solicitudes · Ver" />;
    throw e;
  }
  if (list.items.length === 0) {
    return <ViewState kind="empty" entity="solicitudes" text="Cuando pidas reposición, tus solicitudes aparecerán aquí." canCreate={canRequest} action={<NewLink />} />;
  }
  return (
    <div className="stack" aria-label="Solicitudes">
      {list.items.map((r) => (
        <EntityCard
          key={r.id}
          avatar={String(r.lineCount)}
          title={<Link href={`/solicitudes/${r.id}`}>Pediste {r.lineCount} {r.lineCount === 1 ? "producto" : "productos"}</Link>}
          subtitle={<LocalDateTime value={r.createdAt} />}
          badge={<StatusBadge {...requestBadge(r.status)} />}
          data={[{ label: "Tienda", value: r.storeName }]}
        />
      ))}
      <UrlPager page={page} pageSize={PAGE_SIZE} total={list.total} unit={list.total === 1 ? "solicitud" : "solicitudes"} />
    </div>
  );
}

export default function RequestsPage({ searchParams }: PageProps<"/solicitudes">) {
  return (
    <div className="stack">
      <PageHeader title="Solicitudes" description="Lo que pediste al almacén y cómo va cada producto." actions={<Suspense fallback={null}><HeaderAction /></Suspense>} />
      <Suspense fallback={<Loading />}>
        <RequestsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function HeaderAction() {
  const { canRequest, canHandle } = await requireRequestUser();
  return (
    <>
      {canHandle && (
        <>
          <Link className={buttonClass("secondary", "md")} href="/solicitudes/bandeja">
            Bandeja
          </Link>
          <Link className={buttonClass("secondary", "md")} href="/solicitudes/bolsa">
            Bolsa por comprar
          </Link>
        </>
      )}
      {canRequest && <NewLink />}
    </>
  );
}
