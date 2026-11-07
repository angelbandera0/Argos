import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { lineBadge, requestBadge } from "@/components/requests/request-logic";
import { formatStockQty } from "@/components/stock/stock-list-logic";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { EntityCard } from "@/components/ui/entity-card";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ViewState } from "@/components/ui/view-state";
import { Forbidden, NotFound } from "@/core/domain/errors";
import { type LineStatus, assignedBase, lineStatus } from "@/core/domain/requests";
import { requireRequestUser } from "../guard";
import Loading from "../loading";

export const instant = false;

export const metadata: Metadata = { title: "Solicitud · Argos" };

async function DetailContent({ params, searchParams }: Pick<PageProps<"/solicitudes/[id]">, "params" | "searchParams">) {
  const { id } = await params;
  const sent = (await searchParams).enviada === "1";
  const { actor, requests, stock, companyId } = await requireRequestUser();
  if (!companyId) notFound();
  let r;
  try {
    r = await requests.getRequest(actor, { companyId, requestId: id });
  } catch (e) {
    if (e instanceof NotFound) notFound();
    if (e instanceof Forbidden) return <ViewState kind="forbidden" entity="solicitudes" permission="Solicitudes · Ver" />;
    throw e;
  }
  const baseUnits = new Map(
    await Promise.all(r.lines.map(async (l) => [l.productId, await stock.getProductStockConfig(actor, { productId: l.productId }).then((c) => c.baseUnit, () => null)] as const)),
  );
  return (
    <>
      {sent && <Alert variant="success" title="Solicitud enviada al almacén." />}
      <Card>
        <div className="stack">
          <StatusBadge {...requestBadge(r.status)} />
          <p className="muted">
            {r.storeName} · <LocalDateTime value={r.createdAt} />
          </p>
          {r.note && <p>Nota: {r.note}</p>}
        </div>
      </Card>
      <div className="stack" aria-label="Productos pedidos">
        {r.lines.map((l) => {
          const status: LineStatus = lineStatus(l.qtyBase, l.assignments);
          const base = baseUnits.get(l.productId);
          const asked = l.unit === "base" && base ? formatStockQty(l.qty, base) : `${l.qty} ${l.unit}`;
          const reasons = l.assignments.filter((a) => a.kind === "rejected" && a.reason);
          return (
            <EntityCard
              key={l.id}
              avatar={l.productName.charAt(0).toUpperCase()}
              title={l.productName}
              badge={<StatusBadge {...lineBadge(status)} />}
              data={[
                { label: "Pediste", value: asked },
                { label: "Atendido", value: base ? formatStockQty(assignedBase(l.assignments), base) : String(assignedBase(l.assignments)) },
              ]}
            >
              {reasons.map((a) => (
                <p key={a.id} className="hint">
                  Motivo: {a.reason}
                </p>
              ))}
            </EntityCard>
          );
        })}
      </div>
    </>
  );
}

export default function RequestDetailPage(props: PageProps<"/solicitudes/[id]">) {
  return (
    <div className="stack">
      <PageHeader title="Solicitud" breadcrumbs={[{ label: "Solicitudes", href: "/solicitudes" }, { label: "Detalle" }]} />
      <Suspense fallback={<Loading />}>
        <DetailContent params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
