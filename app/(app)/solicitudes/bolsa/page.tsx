import type { Metadata } from "next";
import { Suspense } from "react";
import { groupBag } from "@/components/requests/inbox-logic";
import { formatStockQty } from "@/components/stock/stock-list-logic";
import { EntityCard } from "@/components/ui/entity-card";
import { PageHeader } from "@/components/ui/page-header";
import { ViewState } from "@/components/ui/view-state";
import { Forbidden } from "@/core/domain/errors";
import { requireRequestUser } from "../guard";
import Loading from "../loading";

export const instant = false;

export const metadata: Metadata = { title: "Bolsa por comprar · Argos" };

async function BagContent() {
  const { actor, requests, stock, companyId } = await requireRequestUser();
  if (!companyId) return <ViewState kind="empty" entity="solicitudes" title="Elige una compañía arriba para ver la bolsa." canCreate={false} />;
  let rows;
  try {
    rows = await requests.listPurchaseBag(actor, { companyId });
  } catch (e) {
    if (e instanceof Forbidden) return <ViewState kind="forbidden" entity="solicitudes" permission="Solicitudes · Atender" />;
    throw e;
  }
  if (rows.length === 0) return <ViewState kind="empty" entity="solicitudes" text="No hay nada por comprar." canCreate={false} />;
  const groups = groupBag(rows);
  const units = new Map(await Promise.all(groups.map(async (g) => [g.productId, await stock.getProductStockConfig(actor, { productId: g.productId }).then((c) => c.baseUnit, () => null)] as const)));
  return (
    <div className="stack" aria-label="Productos por comprar">
      {groups.map((g) => {
        const u = units.get(g.productId);
        const fmt = (n: number) => (u ? formatStockQty(n, u) : String(n));
        return (
          <EntityCard
            key={g.productId}
            avatar={g.productName.charAt(0).toUpperCase()}
            title={g.productName}
            data={[{ label: "Total", value: fmt(g.total) }, ...g.stores.map((s) => ({ label: s.storeName, value: fmt(s.qtyBase) }))]}
          />
        );
      })}
    </div>
  );
}

export default function BagPage() {
  return (
    <div className="stack">
      <PageHeader title="Bolsa por comprar" description="Lo que las tiendas necesitan y el almacén no tiene, por producto y destino." breadcrumbs={[{ label: "Solicitudes", href: "/solicitudes" }, { label: "Bolsa por comprar" }]} />
      <Suspense fallback={<Loading />}>
        <BagContent />
      </Suspense>
    </div>
  );
}
