import type { Metadata } from "next";
import { Suspense } from "react";
import { AttendButton } from "@/components/requests/attend-dialog";
import { InboxFilters } from "@/components/requests/inbox-filters";
import { parseInboxStatus } from "@/components/requests/inbox-logic";
import { lineBadge, requestBadge } from "@/components/requests/request-logic";
import { formatStockQty } from "@/components/stock/stock-list-logic";
import { EntityCard } from "@/components/ui/entity-card";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ViewState } from "@/components/ui/view-state";
import { Forbidden } from "@/core/domain/errors";
import { type LineStatus, lineStatus, remainingBase } from "@/core/domain/requests";
import { requireRequestUser } from "../guard";
import Loading from "../loading";

export const instant = false;

export const metadata: Metadata = { title: "Bandeja de solicitudes · Argos" };

const first = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

async function InboxContent({ searchParams }: { searchParams: PageProps<"/solicitudes/bandeja">["searchParams"] }) {
  const { actor, requests, stock, companyId, canWh, costs, currencies } = await requireRequestUser();
  if (!companyId) return <ViewState kind="empty" entity="solicitudes" title="Elige una compañía arriba para ver sus solicitudes." canCreate={false} />;
  const sp = await searchParams;
  const status = parseInboxStatus(sp.estado);
  let locations, list;
  let currentStore = "";
  try {
    locations = await stock.listLocations(actor, { companyId });
    currentStore = locations.some((l) => l.kind === "store" && l.storeId === first(sp.tienda)) ? first(sp.tienda) : "";
    list = await requests.listRequests(actor, { companyId, status, storeId: currentStore || undefined, pageSize: 20 });
  } catch (e) {
    if (e instanceof Forbidden) return <ViewState kind="forbidden" entity="solicitudes" permission="Solicitudes · Atender" />;
    throw e;
  }
  const storeOptions = locations.filter((l) => l.kind === "store" && l.storeId).map((l) => ({ value: l.storeId as string, label: l.name }));
  const warehouse =locations.find((l) => l.kind === "warehouse");
  const currencyList = costs ? (await currencies.listCurrencies(actor, { companyId }).catch(() => [])).map((c) => ({ id: c.id, code: c.code })) : [];
  const details = await Promise.all(list.items.map((r) => requests.getRequest(actor, { companyId, requestId: r.id })));
  const productIds = [...new Set(details.flatMap((d) => d.lines.map((l) => l.productId)))];
  const stocks = new Map(
    await Promise.all(
      productIds.map(async (productId) => [productId, warehouse ? await stock.getProductStock(actor, { productId, locationId: warehouse.id, onlyAvailable: true }).catch(() => null) : null] as const),
    ),
  );
  return (
    <>
      <InboxFilters estado={status ?? ""} tienda={currentStore} stores={storeOptions} />
      {details.length === 0 && <ViewState kind="empty" entity="solicitudes" text="No hay solicitudes con esos filtros." canCreate={false} />}
      {details.map((r) => (
        <section key={r.id} className="stack" aria-label={`Solicitud de ${r.storeName}`}>
          <h2>
            {r.storeName} · <LocalDateTime value={r.createdAt} /> <StatusBadge {...requestBadge(r.status)} />
          </h2>
          {r.lines.map((l) => {
            const st: LineStatus = lineStatus(l.qtyBase, l.assignments);
            const s = stocks.get(l.productId);
            const unit = s?.config.baseUnit;
            const remaining = remainingBase(l.qtyBase, l.assignments);
            const fmt = (n: number) => (unit ? formatStockQty(n, unit) : String(n));
            return (
              <EntityCard
                key={l.id}
                avatar={l.productName.charAt(0).toUpperCase()}
                title={l.productName}
                badge={<StatusBadge {...lineBadge(st)} />}
                data={[
                  { label: "Pidió", value: fmt(l.qtyBase) },
                  { label: "Falta decidir", value: fmt(remaining) },
                  { label: "En almacén", value: s ? fmt(s.quantity) : "—" },
                ]}
              >
                {remaining > 0 && unit && <AttendButton productId={l.productId} warehouseId={warehouse?.id ?? ""} canChooseLot={canWh("choose_lot")} currencies={currencyList} lineId={l.id} productName={l.productName} remaining={remaining} warehouse={s?.quantity ?? 0} unit={unit} />}
              </EntityCard>
            );
          })}
        </section>
      ))}
      {list.total > details.length && <p className="hint">Se muestran las {details.length} más recientes de {list.total}.</p>}
    </>
  );
}

export default function InboxPage(props: PageProps<"/solicitudes/bandeja">) {
  return (
    <div className="stack">
      <PageHeader title="Bandeja de solicitudes" description="Decide qué hacer con cada producto pedido por las tiendas." breadcrumbs={[{ label: "Solicitudes", href: "/solicitudes" }, { label: "Bandeja" }]} />
      <Suspense fallback={<Loading />}>
        <InboxContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
