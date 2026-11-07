import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderBuilder } from "@/components/orders/order-builder";
import { draftFromBag } from "@/components/orders/order-logic";
import { groupBag } from "@/components/requests/inbox-logic";
import { PageHeader } from "@/components/ui/page-header";
import { ViewState } from "@/components/ui/view-state";
import { Forbidden } from "@/core/domain/errors";
import { makeCatalog } from "@/infrastructure/supabase/catalog-factory";
import { makeOrderRepository } from "@/infrastructure/supabase/order-repository";
import { makeUserRepository } from "@/infrastructure/supabase/user-repository";
import { requireRequestUser } from "../../solicitudes/guard";
import { requireOrderUser } from "../guard";
import Loading from "../loading";

export const instant = false;

export const metadata: Metadata = { title: "Armar pedido · Argos" };

async function BuilderContent() {
  const { actor, stock, companyId, canBuild, supabase } = await requireOrderUser();
  if (!companyId) return <ViewState kind="empty" entity="pedidos" title="Elige una compañía arriba para armar un pedido." canCreate={false} />;
  if (!canBuild) return <ViewState kind="forbidden" entity="pedidos" permission="Pedidos · Armar pedidos" />;
  const { requests } = await requireRequestUser();
  const [bag, locations, products, profiles] = await Promise.all([
    requests.listPurchaseBag(actor, { companyId }).catch((e) => (e instanceof Forbidden ? [] : Promise.reject(e))),
    stock.listLocations(actor, { companyId }),
    makeCatalog(supabase).listProducts(actor, { companyId, onlyActive: true }).catch(() => []),
    makeUserRepository(supabase).listForCompany(companyId).catch(() => []),
  ]);
  const repo = makeOrderRepository(supabase);
  const eligible = await Promise.all(profiles.filter((p) => p.status === "active").map(async (p) => ((await repo.isEligibleBuyer(companyId, p.id)) ? p : null)));
  const groups = groupBag(bag);
  const units = Object.fromEntries(await Promise.all(groups.map(async (g) => [g.productId, await stock.getProductStockConfig(actor, { productId: g.productId }).then((c) => c.baseUnit as string, () => "")] as const)));
  return (
    <OrderBuilder
      initial={draftFromBag(groups, units)}
      stores={locations.filter((l) => l.kind === "store" && l.storeId).map((l) => ({ id: l.storeId as string, name: l.name }))}
      products={products.map((p) => ({ value: p.id, label: p.name }))}
      buyers={eligible.filter((p) => p !== null).map((p) => ({ value: p.id, label: p.displayName }))}
    />
  );
}

export default function NewOrderPage() {
  return (
    <div className="stack">
      <PageHeader title="Armar pedido" description="Reúne lo que hay que comprar y asígnalo a un comprador." breadcrumbs={[{ label: "Pedidos", href: "/pedidos" }, { label: "Armar pedido" }]} />
      <Suspense fallback={<Loading />}>
        <BuilderContent />
      </Suspense>
    </div>
  );
}
