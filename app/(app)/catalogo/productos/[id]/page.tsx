import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { DeleteProductDialog } from "@/components/catalog/delete-product-dialog";
import { ProductForm } from "@/components/catalog/product-form";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireCatalogUser } from "../../guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Producto · Argos" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function Editor({ params }: { params: PageProps<"/catalogo/productos/[id]">["params"] }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const { actor, catalog, companyId, permissions } = await requireCatalogUser();
  if (!permissions.view) return <Alert variant="warning">No tienes acceso a esto. Tu rol no incluye el permiso «Ver».</Alert>;
  if (!companyId) return <EmptyState icon="Box" title="Elige una compañía arriba para ver sus productos." />;
  const [products, categories] = await Promise.all([
    catalog.listProducts(actor, { companyId }),
    catalog.listCategories(actor, { companyId }),
  ]);
  const product = products.find((p) => p.id === id);
  if (!product) notFound();
  return (
    <div className="stack">
      <PageHeader
        title={product.name}
        breadcrumbs={[{ label: "Productos", href: "/catalogo/productos" }, { label: product.name }]}
        actions={permissions.delete ? <DeleteProductDialog productId={product.id} name={product.name} /> : undefined}
      />
      <ProductForm
        productId={product.id}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        initial={{
          name: product.name,
          categoryId: product.categoryId,
          description: product.description ?? "",
          active: product.active,
        }}
        readOnlyReason={permissions.edit ? undefined : "Solo puedes ver este producto: tu rol no incluye el permiso «Editar»."}
      />
    </div>
  );
}

export default function ProductPage(props: PageProps<"/catalogo/productos/[id]">) {
  return (
    <Suspense fallback={<Loading />}>
      <Editor params={props.params} />
    </Suspense>
  );
}
