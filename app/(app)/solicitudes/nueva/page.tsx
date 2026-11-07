import type { Metadata } from "next";
import { Suspense } from "react";
import { NewRequestForm } from "@/components/requests/new-request-form";
import { suggestedAmount } from "@/components/requests/request-logic";
import { formatStockQty, minimumLabel } from "@/components/stock/stock-list-logic";
import { PageHeader } from "@/components/ui/page-header";
import { ViewState } from "@/components/ui/view-state";
import { Forbidden } from "@/core/domain/errors";
import { requireRequestUser } from "../guard";
import Loading from "../loading";

export const instant = false;

export const metadata: Metadata = { title: "Nueva solicitud · Argos" };

const first = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

async function NewContent({ searchParams }: { searchParams: PageProps<"/solicitudes/nueva">["searchParams"] }) {
  const { actor, stock, companyId, storeId, canRequest } = await requireRequestUser();
  if (!companyId) return <ViewState kind="empty" entity="solicitudes" title="Elige una compañía arriba para crear una solicitud." canCreate={false} />;
  if (!canRequest) return <ViewState kind="forbidden" entity="solicitudes" permission="Solicitar reposición" />;
  const sp = await searchParams;
  let stores;
  try {
    stores = (await stock.listLocations(actor, { companyId })).filter((l) => l.kind === "store" && l.storeId && (!storeId || l.storeId === storeId));
  } catch (e) {
    if (e instanceof Forbidden) return <ViewState kind="forbidden" entity="solicitudes" permission="Existencias · Ver" />;
    throw e;
  }
  const location = stores.find((l) => l.storeId === first(sp.tienda)) ?? stores[0];
  if (!location) return <ViewState kind="empty" entity="solicitudes" text="Aún no hay tiendas." canCreate={false} />;

  const items: Awaited<ReturnType<typeof stock.listStockStatus>>["items"] = [];
  for (let page = 1; page <= 10; page++) {
    const r = await stock.listStockStatus(actor, { companyId, locationId: location.id, page, pageSize: 100 });
    items.push(...r.items);
    if (items.length >= r.total) break;
  }
  const products = items.map((i) => ({
    value: i.productId,
    label: i.productName,
    hint: `Hay ${formatStockQty(i.quantity, i.baseUnit)} · mín. ${minimumLabel(i.minimum, i.baseUnit).replace("Sin mínimo", "sin mínimo")}`,
  }));
  const initial =
    first(sp.reponer) === "1"
      ? items.filter((i) => i.status !== "normal").map((i) => ({ productId: i.productId, amount: suggestedAmount(i.quantity, i.minimum) }))
      : [];
  return (
    <>
      {initial.length > 0 && <p className="muted">Vienen marcados los productos bajos y agotados de {location.name}.</p>}
      <NewRequestForm
        key={location.id}
        products={products}
        initial={initial}
        storeId={location.storeId as string}
        stores={storeId ? undefined : stores.map((l) => ({ value: l.storeId as string, label: l.name }))}
      />
    </>
  );
}

export default function NewRequestPage(props: PageProps<"/solicitudes/nueva">) {
  return (
    <div className="stack">
      <PageHeader title="Nueva solicitud" description="Pide al almacén los productos que necesitas." breadcrumbs={[{ label: "Solicitudes", href: "/solicitudes" }, { label: "Nueva" }]} />
      <Suspense fallback={<Loading />}>
        <NewContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
