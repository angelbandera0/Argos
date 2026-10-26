import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryForm } from "@/components/catalog/category-form";
import { CategoryRow } from "@/components/catalog/category-row";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { requireCategoryAdmin } from "../guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Categorías · Argos" };

async function CategoryList() {
  const { actor, catalog, companyId, companyName } = await requireCategoryAdmin();
  if (!companyId) {
    return <EmptyState icon="Tags" title="Elige una compañía arriba para ver sus categorías." />;
  }
  const categories = await catalog.listCategories(actor, { companyId });
  return (
    <div className="stack">
      <Card>
        <CategoryForm />
      </Card>
      {categories.length === 0 ? (
        <EmptyState icon="Tags" title={`Aún no hay categorías en ${companyName}.`}>
          Agrega la primera para poder crear productos.
        </EmptyState>
      ) : (
        <Card>
          <ul className="list" aria-label="Categorías">
            {categories.map((c) => (
              <li key={c.id}>
                <CategoryRow id={c.id} name={c.name} />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <div className="stack">
      <PageHeader title="Categorías" />
      <Suspense fallback={<Loading />}>
        <CategoryList />
      </Suspense>
    </div>
  );
}
