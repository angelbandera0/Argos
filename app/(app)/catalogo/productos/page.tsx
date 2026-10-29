import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "@/components/icons";
import { ProductList } from "@/components/catalog/product-list";
import { PAGE_SIZE, matchesQuery, matchesStatus, parseStatusParam, statusCounts } from "@/components/catalog/product-list-logic";
import { Alert } from "@/components/ui/alert";
import { buttonClass } from "@/components/ui/button-class";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireCatalogUser } from "../guard";
import Loading from "./loading";

const parsePage = (v: unknown) => {
  const n = typeof v === "string" ? Number.parseInt(v, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
};

export const instant = false;

export const metadata: Metadata = { title: "Productos · Argos" };

const NewLink = () => (
  <Link className={buttonClass("primary", "md")} href="/catalogo/productos/nuevo">
    <Plus aria-hidden="true" />
    Nuevo producto
  </Link>
);

async function ProductListContent({ searchParams }: { searchParams: PageProps<"/catalogo/productos">["searchParams"] }) {
  const { actor, catalog, companyId, permissions } = await requireCatalogUser();
  if (!companyId) {
    return <EmptyState icon="Box" title="Elige una compañía arriba para ver sus productos." />;
  }
  if (!permissions.view) {
    return <Alert variant="warning">No tienes acceso a esto. Tu rol no incluye el permiso «Ver».</Alert>;
  }
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const [all, categories] = await Promise.all([
    catalog.listProducts(actor, { companyId }),
    catalog.listCategories(actor, { companyId }),
  ]);
  const names = new Map(categories.map((c) => [c.id, c.name]));
  const categoria = typeof sp.categoria === "string" && names.has(sp.categoria) ? sp.categoria : "";
  const estado = parseStatusParam(sp.estado);

  if (all.length === 0) {
    return (
      <EmptyState icon="Box" title="Aún no hay productos." action={permissions.create ? <NewLink /> : undefined}>
        {permissions.create ? "Crea el primero para empezar a vender." : "Cuando se agreguen, aparecerán aquí."}
      </EmptyState>
    );
  }

  const base = all.filter((p) => matchesQuery(p, q) && (!categoria || p.categoryId === categoria));
  const shown = base.filter((p) => matchesStatus(estado, p.active));
  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE));
  const pagina = Math.min(parsePage(sp.pagina), pages);

  return (
    <ProductList
      rows={shown.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE).map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: names.get(p.categoryId) ?? "",
        active: p.active,
      }))}
      total={shown.length}
      pageSize={PAGE_SIZE}
      filters={{ q, categoria, estado, pagina }}
      counts={statusCounts(base)}
      categories={categories.map((c) => ({ value: c.id, label: c.name }))}
      canEdit={permissions.edit}
      canDelete={permissions.delete}
    />
  );
}

export default function ProductsPage(props: PageProps<"/catalogo/productos">) {
  return (
    <div className="stack">
      <PageHeader
        title="Productos"
        description="Lo que se ofrece en ventas. Los inactivos no aparecen en caja."
        actions={
          <Suspense>
            <NewLinkIfAllowed />
          </Suspense>
        }
      />
      <Suspense fallback={<Loading />}>
        <ProductListContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function NewLinkIfAllowed() {
  const { permissions, companyId } = await requireCatalogUser();
  return permissions.create && companyId ? <NewLink /> : null;
}
