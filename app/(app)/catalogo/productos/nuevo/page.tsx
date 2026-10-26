import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Alert } from "@/components/ui/alert";
import { buttonClass } from "@/components/ui/button-class";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { ProductForm } from "@/components/catalog/product-form";
import { requireCatalogUser } from "../../guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Nuevo producto · Argos" };

async function Editor() {
  const { actor, catalog, companyId, permissions } = await requireCatalogUser();
  if (!permissions.create) return <Alert variant="warning">No tienes acceso a esto. Tu rol no incluye el permiso «Crear».</Alert>;
  if (!companyId) return <EmptyState icon="Box" title="Elige una compañía arriba para crear productos." />;
  const categories = await catalog.listCategories(actor, { companyId });
  if (categories.length === 0) {
    return (
      <EmptyState
        icon="Tags"
        title="Antes de crear productos necesitas una categoría."
        action={
          actor.kind === "admin" ? (
            <Link className={buttonClass("primary", "md")} href="/catalogo/categorias">
              Crear una categoría
            </Link>
          ) : undefined
        }
      >
        {actor.kind === "admin" ? undefined : "Pídesela a un administrador."}
      </EmptyState>
    );
  }
  return (
    <ProductForm
      productId={null}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      initial={{ name: "", categoryId: "", description: "", active: true }}
    />
  );
}

export default function NewProductPage() {
  return (
    <div className="stack">
      <PageHeader
        title="Nuevo producto"
        breadcrumbs={[{ label: "Productos", href: "/catalogo/productos" }, { label: "Nuevo producto" }]}
      />
      <Suspense fallback={<Loading />}>
        <Editor />
      </Suspense>
    </div>
  );
}
