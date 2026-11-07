import type { Metadata } from "next";
import { Suspense } from "react";
import { StockList, type StockRow } from "@/components/stock/stock-list";
import { PAGE_SIZE, averageCost, groupLotsByProduct, lotsValue, parsePage, parseStatus } from "@/components/stock/stock-list-logic";
import { PageHeader } from "@/components/ui/page-header";
import { ViewState } from "@/components/ui/view-state";
import { Forbidden } from "@/core/domain/errors";
import { makeCatalog } from "@/infrastructure/supabase/catalog-factory";
import { createServerClient } from "@/infrastructure/supabase/server-client";
import { requireStockUser } from "./guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Existencias · Argos" };

const first = (v: string | string[] | undefined) => (typeof v === "string" ? v : "");

async function StockContent({ searchParams }: { searchParams: PageProps<"/existencias">["searchParams"] }) {
  const { actor, stock, currencies, companyId, storeId, can, costs } = await requireStockUser();
  if (!companyId) return <ViewState kind="empty" entity="existencias" title="Elige una compañía arriba para ver sus existencias." canCreate={false} />;
  let locations;
  try {
    locations = await stock.listLocations(actor, { companyId });
  } catch (e) {
    if (e instanceof Forbidden) return <ViewState kind="forbidden" entity="existencias" permission="Existencias · Ver" />;
    throw e;
  }
  const sp = await searchParams;
  const wanted = first(sp.ubicacion);
  const location =
    locations.find((l) => l.id === wanted) ?? locations.find((l) => l.kind === "warehouse") ?? locations.find((l) => l.storeId === storeId) ?? locations[0];
  if (!location) return <ViewState kind="empty" entity="existencias" text="Aún no hay ubicaciones." canCreate={false} />;

  const catalog = makeCatalog(await createServerClient());
  const products = await catalog.listProducts(actor, { companyId }).catch(() => []);
  const categories = (await catalog.listCategories(actor, { companyId }).catch(() => [])).map((c) => ({ value: c.id, label: c.name }));
  const categoria = categories.some((c) => c.value === first(sp.categoria)) ? first(sp.categoria) : "";
  const estado = parseStatus(sp.estado);
  const q = first(sp.q);
  const pagina = parsePage(sp.pagina);

  const [list, lots, currencyList] = await Promise.all([
    stock.listStockStatus(actor, {
      companyId,
      locationId: location.id,
      status: estado === "todos" ? undefined : estado,
      q,
      categoryId: categoria || undefined,
      page: pagina,
      pageSize: PAGE_SIZE,
    }),
    costs ? stock.listLocationLots(actor, { companyId, locationId: location.id }) : Promise.resolve([]),
    costs ? currencies.listCurrencies(actor, { companyId }).catch(() => []) : Promise.resolve([]),
  ]);

  const byProduct = groupLotsByProduct(lots);
  const rows: StockRow[] = list.items.map((l) => {
    const value = lotsValue(byProduct.get(l.productId) ?? []);
    const avg = averageCost(value);
    return {
      productId: l.productId,
      name: l.productName,
      category: l.categoryName,
      quantity: l.quantity,
      unit: l.baseUnit,
      status: l.status,
      minimum: l.minimum,
      avgCost: avg,
      value: value.byCurrency.map((v) => ({ currencyId: v.currencyId, amount: v.value })),
      unknownCost: value.unknownQty > 0 || (l.quantity > 0 && value.byCurrency.length === 0),
    };
  });
  const productValues = [...byProduct.values()].map(lotsValue);

  return (
    <StockList
      rows={rows}
      total={list.total}
      counts={list.counts}
      pageSize={PAGE_SIZE}
      filters={{ ubicacion: location.id, q, categoria, estado, pagina }}
      locations={locations.map((l) => ({ value: l.id, label: l.name }))}
      categories={categories}
      location={location.kind === "warehouse" ? "almacén general" : location.name}
      costs={costs}
      currencies={Object.fromEntries(currencyList.map((c) => [c.id, { code: c.code, decimals: c.decimals }]))}
      inventory={costs ? { values: productValues.flatMap((p) => p.byCurrency), unknownProducts: productValues.filter((p) => p.unknownQty > 0).length } : undefined}
      canEntry={can("initial_entry")}
      canTransfer={can("transfer")}
      canWriteOff={can("write_off")}
      canDirect={can("direct_store_entry")}
      transfer={{ fromLocationId: location.id, stores: locations.filter((l) => l.kind === "store").map((l) => ({ value: l.id, label: l.name })), products: products.filter((p) => p.active).map((p) => ({ value: p.id, label: p.name })), canChooseLot: can("choose_lot"), currencies: currencyList.map((c) => ({ id: c.id, code: c.code })) }}
      entry={{ locationId: location.id, products: products.filter((p) => p.active).map((p) => ({ value: p.id, label: p.name })), currencies: currencyList.map((c) => ({ id: c.id, code: c.code })) }}
      isWarehouse={location.kind === "warehouse"}
    />
  );
}

export default function StockPage(props: PageProps<"/existencias">) {
  return (
    <div className="stack">
      <PageHeader title="Existencias" description="Lo que hay en cada ubicación, en la unidad base de cada producto." />
      <Suspense fallback={<Loading />}>
        <StockContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}
