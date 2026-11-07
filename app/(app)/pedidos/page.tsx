import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OrderFilters } from "@/components/orders/order-filters";
import { OrderTable } from "@/components/orders/order-table";
import { orderNumber, parseDateRange, parseOrderStatus } from "@/components/orders/order-logic";
import { buttonClass } from "@/components/ui/button-class";
import { dayBoundsInTimeZone } from "@/components/history/time-zone";
import { parsePage } from "@/components/ui/page-param";
import { UrlPager } from "@/components/ui/url-pager";
import { PageHeader } from "@/components/ui/page-header";
import { ViewState } from "@/components/ui/view-state";
import { Forbidden } from "@/core/domain/errors";
import { makeUserRepository } from "@/infrastructure/supabase/user-repository";
import { companyTimeZone } from "../historial/guard";
import { requireOrderUser } from "./guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Pedidos · Argos" };

const PAGE_SIZE = 20;
const first = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

async function OrdersContent({ searchParams }: { searchParams: PageProps<"/pedidos">["searchParams"] }) {
  const { actor, orders, supabase, companyId, canBuild } = await requireOrderUser();
  if (!companyId) return <ViewState kind="empty" entity="pedidos" title="Elige una compañía arriba para ver sus pedidos." canCreate={false} />;
  const sp = await searchParams;
  const status = parseOrderStatus(sp.estado);
  const range = parseDateRange(sp.desde, sp.hasta);
  const profiles = canBuild ? await makeUserRepository(supabase).listForCompany(companyId).catch(() => []) : [];
  const names = new Map(profiles.map((p) => [p.id, p.displayName]));
  const buyer = canBuild && names.has(first(sp.comprador)) ? first(sp.comprador) : "";
  const tz = await companyTimeZone(companyId);
  const page = parsePage(sp.pagina);
  let list;
  try {
    list = await orders.listOrders(actor, {
      companyId,
      status,
      buyerId: buyer || undefined,
      createdFrom: range.from ? dayBoundsInTimeZone(range.from, tz).start.toISOString() : undefined,
      createdTo: range.to ? dayBoundsInTimeZone(range.to, tz).end.toISOString() : undefined,
      page,
      pageSize: PAGE_SIZE,
    });
  } catch (e) {
    if (e instanceof Forbidden) return <ViewState kind="forbidden" entity="pedidos" permission="Pedidos · Ver" />;
    throw e;
  }
  const rows = list.items.map((o) => ({ id: o.id, number: orderNumber(o.id), status: o.status, buyer: o.buyerId ? (names.get(o.buyerId) ?? "—") : "Sin asignar", lineCount: o.lineCount, createdAt: o.createdAt }));
  const filtered = !!(status || buyer || range.from || range.to);
  return (
    <>
      <OrderFilters estado={status ?? ""} comprador={buyer} desde={range.from} hasta={range.to} buyers={canBuild ? profiles.filter((p) => p.status === "active").map((p) => ({ value: p.id, label: p.displayName })) : []} />
      {rows.length === 0 ? (
        <ViewState kind={filtered ? "no-match" : "empty"} entity="pedidos" text={filtered ? undefined : "Crea el primero desde la bolsa por comprar."} canCreate={false} />
      ) : (
        <>
          <OrderTable rows={rows} />
          <UrlPager page={page} pageSize={PAGE_SIZE} total={list.total} unit={list.total === 1 ? "pedido" : "pedidos"} />
        </>
      )}
    </>
  );
}

export default function OrdersPage({ searchParams }: PageProps<"/pedidos">) {
  return (
    <div className="stack">
      <PageHeader
        title="Pedidos"
        description="Compras del almacén: de la bolsa por comprar al pedido cumplido."
        actions={
          <>
            <Link className={buttonClass("secondary", "md")} href="/solicitudes/bolsa">
              Bolsa por comprar
            </Link>
            <Link className={buttonClass("primary", "md")} href="/pedidos/nuevo">
              Armar pedido
            </Link>
          </>
        }
      />
      <Suspense fallback={<Loading />}>
        <OrdersContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
