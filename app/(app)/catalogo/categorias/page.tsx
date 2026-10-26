import type { Metadata } from "next";
import { Suspense } from "react";
import { Tags } from "@/components/icons";
import { CategoryForm } from "@/components/catalog/category-form";
import { CategoryRow } from "@/components/catalog/category-row";
import { Card } from "@/components/ui/card";
import { requireCategoryAdmin } from "../guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Categorías · Argos" };

async function CategoryList() {
  const { actor, catalog, companyId, companyName } = await requireCategoryAdmin();
  if (!companyId) {
    return (
      <Card className="empty">
        <span className="icon-dot" aria-hidden="true">
          <Tags />
        </span>
        <p>Elige una compañía arriba para ver sus categorías.</p>
      </Card>
    );
  }
  const categories = await catalog.listCategories(actor, { companyId });
  return (
    <div className="stack">
      <Card>
        <CategoryForm />
      </Card>
      {categories.length === 0 ? (
        <Card className="empty">
          <span className="icon-dot" aria-hidden="true">
            <Tags />
          </span>
          <p>Aún no hay categorías en {companyName}. Agrega la primera para poder crear productos.</p>
        </Card>
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
    <>
      <div className="topbar">
        <h1 className="page-title">Categorías</h1>
      </div>
      <Suspense fallback={<Loading />}>
        <CategoryList />
      </Suspense>
    </>
  );
}
