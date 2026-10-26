import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Card } from "@/components/ui/card";
import { ProductForm } from "@/components/catalog/product-form";
import { requireCatalogUser } from "../../guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Nuevo producto · Argos" };

async function Editor() {
  const { actor, catalog, companyId, permissions } = await requireCatalogUser();
  if (!permissions.create) return <Card>No tienes acceso a esto. Tu rol no incluye el permiso «Crear».</Card>;
  if (!companyId) return <Card>Elige una compañía arriba para crear productos.</Card>;
  const categories = await catalog.listCategories(actor, { companyId });
  if (categories.length === 0) {
    return (
      <Card>
        <p>
          Antes de crear productos necesitas una categoría.{" "}
          {actor.kind === "admin" ? <Link href="/catalogo/categorias">Crear una categoría</Link> : "Pídesela a un administrador."}
        </p>
      </Card>
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
    <>
      <div className="topbar">
        <h1 className="page-title">Nuevo producto</h1>
      </div>
      <Suspense fallback={<Loading />}>
        <Editor />
      </Suspense>
    </>
  );
}
