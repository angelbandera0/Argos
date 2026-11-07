import type { Metadata } from "next";
import { Suspense } from "react";
import { orderBadge, orderNumber } from "@/components/orders/order-logic";
import { draftFromLine } from "@/components/orders/purchase-logic";
import { PurchasePanel } from "@/components/orders/purchase-panel";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Tabs } from "@/components/ui/tabs";
import { ViewState } from "@/components/ui/view-state";
import { Forbidden, NotFound } from "@/core/domain/errors";
import { makeCurrencyRepository } from "@/infrastructure/supabase/currency-repository";
import { requireOrderUser } from "../guard";
import Loading from "../loading";

export const instant = false;

export const metadata: Metadata = { title: "Pedido · Argos" };

async function OrderContent({ params }: { params: PageProps<"/pedidos/[id]">["params"] }) {
  const { id } = await params;
  const { actor, orders, supabase, companyId } = await requireOrderUser();
  let order;
  try {
    order = await orders.getOrder(actor, { companyId, orderId: id });
  } catch (e) {
    if (e instanceof NotFound) return <ViewState kind="empty" entity="pedidos" title="Este pedido no existe o no tienes acceso." canCreate={false} />;
    if (e instanceof Forbidden) return <ViewState kind="forbidden" entity="pedidos" permission="Pedidos · Ver" />;
    throw e;
  }
  const currency = (order.currencyId && (await makeCurrencyRepository(supabase).get(order.currencyId).catch(() => null))) || { code: "", decimals: 2 };
  const canBuy = (order.buyerId === actor.userId || actor.kind === "admin") && (order.status === "open" || order.status === "returned");
  /* T27 añade aquí las secciones de revisión, detalle y corrección (misma lista de pestañas). */
  const sections = [
    canBuy && {
      value: "compra",
      label: "Compra",
      content: (
        <PurchasePanel
          orderId={order.id}
          lines={order.lines.map((l) => ({ id: l.id, name: l.productName, qty: l.qty, unit: l.unit }))}
          initial={order.lines.map(draftFromLine)}
          given={order.amountGiven ?? null}
          currency={currency}
          returnNote={order.status === "returned" ? order.returnNote : null}
        />
      ),
    },
  ].filter((s) => !!s);
  return (
    <>
      <PageHeader title={`Pedido ${orderNumber(order.id)}`} actions={<StatusBadge {...orderBadge(order.status)} />} />
      {sections.length === 0 ? (
        <ViewState kind="empty" entity="detalle" title="Este pedido no está en compra." text="El detalle y la revisión llegan en la siguiente entrega." canCreate={false} />
      ) : (
        <Tabs aria-label="Secciones del pedido" defaultValue={sections[0].value} items={sections} />
      )}
    </>
  );
}

export default function OrderPage({ params }: PageProps<"/pedidos/[id]">) {
  return (
    <div className="stack">
      <Suspense fallback={<Loading />}>
        <OrderContent params={params} />
      </Suspense>
    </div>
  );
}
