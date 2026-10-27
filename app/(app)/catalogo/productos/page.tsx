import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "@/components/icons";
import { ProductTable } from "@/components/catalog/product-table";
import { Alert } from "@/components/ui/alert";
import { buttonClass } from "@/components/ui/button-class";
import { EmptyState } from "@/components/ui/empty-state";
import { ListToolbar } from "@/components/ui/list-toolbar";
import { PageHeader } from "@/components/ui/page-header";
import { requireCatalogUser } from "../guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Productos · Argos" };

const STATUS = { activo: "Activo", inactivo: "Inactivo" } as const;
const STATUS_OPTIONS = [
  { value: "", label: "Todos los estados" },
  ...Object.entries(STATUS).map(([value, label]) => ({ value, label })),
];

const NewLink = () => (
  <Link className={buttonClass("primary", "md")} href="/catalogo/productos/nuevo">
    <Plus aria-hidden="true" />
    Nuevo producto
  </Link>
);

async function ProductList({ searchParams }: { searchParams: PageProps<"/catalogo/productos">["searchParams"] }) {
  const { actor, catalog, companyId, permissions } = await requireCatalogUser();
  if (!companyId) {
    return <EmptyState icon="Box" title="Elige una compañía arriba para ver sus productos." />;
  }
  if (!permissions.view) {
    return <Alert variant="warning">No tienes acceso a esto. Tu rol no incluye el permiso «Ver».</Alert>;
  }
  const { q, categoria, estado } = await searchParams;
  const qs = typeof q === "string" ? q : "";
  const query = qs.trim().toLowerCase();
  const status = typeof estado === "string" && estado in STATUS ? (estado as keyof typeof STATUS) : "";
  const [all, categories] = await Promise.all([
    catalog.listProducts(actor, { companyId }),
    catalog.listCategories(actor, { companyId }),
  ]);
  const names = new Map(categories.map((c) => [c.id, c.name]));
  const category = typeof categoria === "string" && names.has(categoria) ? categoria : "";
  const shown = all.filter(
    (p) =>
      p.name.toLowerCase().includes(query) &&
      (!category || p.categoryId === category) &&
      (!status || p.active === (status === "activo")),
  );

  if (all.length === 0) {
    return (
      <EmptyState icon="Box" title="Aún no hay productos." action={permissions.create ? <NewLink /> : undefined}>
        {permissions.create ? "Crea el primero para empezar a vender." : "Cuando se agreguen, aparecerán aquí."}
      </EmptyState>
    );
  }

  return (
    <>
      <ListToolbar
        search={{ label: "Buscar producto", placeholder: "Buscar por nombre", defaultValue: qs }}
        filters={[
          {
            name: "categoria",
            label: "Categoría",
            options: [{ value: "", label: "Todas las categorías" }, ...categories.map((c) => ({ value: c.id, label: c.name }))],
            defaultValue: category,
          },
          { name: "estado", label: "Estado", options: STATUS_OPTIONS, defaultValue: status },
        ]}
      />
      <ProductTable
        rows={shown.map((p) => ({ id: p.id, name: p.name, category: names.get(p.categoryId) ?? "", active: p.active }))}
      />
    </>
  );
}

export default function ProductsPage(props: PageProps<"/catalogo/productos">) {
  return (
    <div className="stack">
      <PageHeader
        title="Productos"
        actions={
          <Suspense>
            <NewLinkIfAllowed />
          </Suspense>
        }
      />
      <Suspense fallback={<Loading />}>
        <ProductList searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function NewLinkIfAllowed() {
  const { permissions, companyId } = await requireCatalogUser();
  return permissions.create && companyId ? <NewLink /> : null;
}
