import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ProductDetailTabs } from "@/components/stock/product-detail";
import { MOVEMENT_PAGE_SIZE, parseIsoDate, parseMovementType, parseTab } from "@/components/stock/product-detail-logic";
import { formatStockQty, parsePage } from "@/components/stock/stock-list-logic";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ViewState } from "@/components/ui/view-state";
import { Forbidden, NotFound } from "@/core/domain/errors";
import { makeCatalog } from "@/infrastructure/supabase/catalog-factory";
import { createServerClient } from "@/infrastructure/supabase/server-client";
import { requireStockUser } from "../guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Existencias · Argos" };

const first = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

async function ProductContent({ params, searchParams }: { params: PageProps<"/existencias/[productId]">["params"]; searchParams: PageProps<"/existencias/[productId]">["searchParams"] }) {
  const { productId } = await params;
  const sp = await searchParams;
  const { actor, stock, currencies, companyId, storeId, can, costs } = await requireStockUser();
  if (!companyId) return <ViewState kind="empty" entity="existencias" title="Elige una compañía arriba para ver sus existencias." canCreate={false} />;
  let locations;
  try {
    locations = await stock.listLocations(actor, { companyId });
  } catch (e) {
    if (e instanceof Forbidden) return <ViewState kind="forbidden" entity="existencias" permission="Existencias · Ver" />;
    throw e;
  }
  const wanted = first(sp.ubicacion);
  const location =
    locations.find((l) => l.id === wanted) ?? locations.find((l) => l.kind === "warehouse") ?? locations.find((l) => l.storeId === storeId) ?? locations[0];
  if (!location) notFound();

  const filters = {
    ubicacion: location.id,
    pestana: parseTab(sp.pestana),
    tipo: parseMovementType(sp.tipo),
    desde: parseIsoDate(sp.desde),
    hasta: parseIsoDate(sp.hasta),
    pagina: parsePage(sp.pagina),
  };

  let detail;
  try {
    detail = await stock.getProductStock(actor, { productId, locationId: location.id, onlyAvailable: false });
  } catch (e) {
    if (e instanceof NotFound) notFound();
    if (e instanceof Forbidden) return <ViewState kind="forbidden" entity="existencias" permission="Existencias · Ver" />;
    throw e;
  }
  const [products, moves, currencyList] = await Promise.all([
    makeCatalog(await createServerClient()).listProducts(actor, { companyId }).catch(() => []),
    stock.listMovements(actor, {
      companyId,
      productId,
      locationId: location.id,
      type: filters.tipo || undefined,
      from: filters.desde || undefined,
      to: filters.hasta || undefined,
      page: filters.pagina,
      pageSize: MOVEMENT_PAGE_SIZE,
    }),
    costs ? currencies.listCurrencies(actor, { companyId }).catch(() => []) : Promise.resolve([]),
  ]);
  const cfg = await stock.getProductStockConfig(actor, { productId });
  const minimums = (
    await Promise.all(
      locations.map(async (l) => {
        const d = await stock.getProductStock(actor, { productId, locationId: l.id, onlyAvailable: true }).catch(() => null);
        return d && { locationId: l.id, name: l.name, minimum: d.minimum };
      }),
    )
  ).filter((m) => m !== null);
  const name = products.find((p) => p.id === productId)?.name ?? "Producto";
  const unit = detail.config.baseUnit;
  const isWarehouse = location.kind === "warehouse";
  const gated = isWarehouse ? [can("transfer") && "Trasladar a tienda", can("write_off") && "Dar de baja", can("initial_entry") && "Entrada inicial"].filter(Boolean) : [];

  return (
    <>
      <PageHeader
        title={name}
        breadcrumbs={[{ label: "Existencias", href: `/existencias?ubicacion=${location.id}` }, { label: name }]}
        description={`${location.name} · Existencia ${formatStockQty(detail.quantity, unit)}`}
        actions={gated.map((label) => (
          <Button key={String(label)} variant="secondary" disabled title="Próximamente">{label}</Button>
        ))}
      />
      <div className="row">
        <StatusBadge family="stock" status={detail.status} />
      </div>
      <ProductDetailTabs
        lots={detail.lots.map((l) => ({ id: l.id, receivedAt: l.receivedAt, initialQty: l.initialQty, remaining: l.remaining, origin: l.origin, unitCost: l.unitCost }))}
        movements={moves.items.map((m) => ({ id: m.id, createdAt: m.createdAt, type: m.type, qtyDelta: m.qtyDelta, reason: m.reasonText ?? m.reasonCode, unitCost: m.unitCost }))}
        total={moves.total}
        unit={unit}
        costs={costs}
        currencies={Object.fromEntries(currencyList.map((c) => [c.id, { code: c.code, decimals: c.decimals }]))}
        filters={filters}
        config={{
          productId,
          baseUnit: cfg.baseUnit,
          presentations: cfg.presentations.map((p) => ({ id: p.id, name: p.name, value: p.content, active: p.active })),
          movementUnits: cfg.movementUnits.map((u) => ({ id: u.id, name: u.name, value: u.equivalence, active: u.active })),
          minimums,
          canUnits: can("configure_units"),
          canMinimums: can("configure_minimums"),
        }}
      />
    </>
  );
}

export default function ProductStockPage(props: PageProps<"/existencias/[productId]">) {
  return (
    <div className="stack">
      <Suspense fallback={<Loading />}>
        <ProductContent params={props.params} searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
