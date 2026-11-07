import type { Metadata } from "next";
import { Suspense } from "react";
import { orderBadge, orderNumber } from "@/components/orders/order-logic";
import { AdjustPanel } from "@/components/orders/adjust-panel";
import { DetailPanel } from "@/components/orders/detail-panel";
import { ReviewPanel } from "@/components/orders/review-panel";
import { timelineSteps, type LotOption } from "@/components/orders/review-logic";
import { draftFromLine } from "@/components/orders/purchase-logic";
import { PurchasePanel } from "@/components/orders/purchase-panel";
import type { CostLot } from "@/components/stock/cost-adjust-dialog";
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
  const { actor, orders, supabase, companyId, can, stock } = await requireOrderUser();
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
  const canReview = order.status === "in_review" && can("review_orders") && order.buyerId !== actor.userId;
  const canAdjust = order.status === "fulfilled" && can("correct_orders");
  const stores = canReview
    ? (await stock.listLocations(actor, { companyId })).filter((l) => l.kind === "store" && l.storeId).map((l) => ({ id: l.storeId as string, name: l.name }))
    : [];
  let lots: LotOption[] = [];
  if (canAdjust || order.status === "fulfilled") {
    const pl = await supabase.from("pedido_lotes").select("lot_id, line_id, lots(remaining)").eq("order_id", order.id);
    const names = new Map(order.lines.map((l) => [l.id, l]));
    lots = ((pl.data ?? []) as unknown as { lot_id: string; line_id: string; lots: { remaining: number | string } | null }[]).map((r) => {
      const remaining = Number(r.lots?.remaining ?? 0);
      const line = names.get(r.line_id);
      return { lotId: r.lot_id, remaining, label: `${line?.productName ?? "Lote"} · quedan ${remaining} ${line?.unit ?? ""}`.trim() };
    });
  }
  let costLots: CostLot[] = [];
  if (canAdjust && can("see_costs") && lots.length) {
    const costs = await supabase.from("lot_costs").select("lot_id, unit_cost, currency_id").in("lot_id", lots.map((l) => l.lotId));
    const byLot = new Map((costs.data ?? []).map((c) => [c.lot_id as string, c]));
    const codes = new Map<string, string>();
    for (const c of byLot.values()) {
      if (c.currency_id && !codes.has(c.currency_id)) codes.set(c.currency_id, (await makeCurrencyRepository(supabase).get(c.currency_id).catch(() => null))?.code ?? "");
    }
    costLots = lots.map((l) => {
      const c = byLot.get(l.lotId);
      return { id: l.lotId, label: l.label, unitCost: c?.unit_cost === null || c?.unit_cost === undefined ? null : Number(c.unit_cost), currencyCode: (c?.currency_id && codes.get(c.currency_id)) || "" };
    });
  }
  const events = await orders.listOrderEvents(actor, { companyId, orderId: order.id });
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
    canReview && {
      value: "revision",
      label: "Revisión",
      content: <ReviewPanel orderId={order.id} lines={order.lines} stores={stores} currency={currency} showCosts={order.spent !== undefined} />,
    },
    {
      value: "detalle",
      label: "Detalle",
      content: <DetailPanel order={order} steps={timelineSteps(events, order.status)} currency={currency} />,
    },
    canAdjust && { value: "correccion", label: "Corrección", content: <AdjustPanel orderId={order.id} lots={lots} costLots={costLots} /> },
  ].filter((s) => !!s);
  return (
    <>
      <PageHeader title={`Pedido ${orderNumber(order.id)}`} actions={<StatusBadge {...orderBadge(order.status)} />} />
      <Tabs aria-label="Secciones del pedido" defaultValue={sections[0].value} items={sections} />
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
