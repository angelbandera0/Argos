import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryManager } from "@/components/catalog/category-manager";
import { Pencil, Trash2 } from "@/components/icons";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { requireCategoryAdmin } from "../guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Categorías · Argos" };

async function CategoryScreen() {
  const { actor, catalog, companyId, companyName } = await requireCategoryAdmin();
  if (!companyId) {
    return <EmptyState icon="Tags" title="Elige una compañía arriba para ver sus categorías." />;
  }
  const [categories, products] = await Promise.all([
    catalog.listCategories(actor, { companyId }),
    catalog.listProducts(actor, { companyId }),
  ]);
  const counts = new Map<string, number>();
  for (const p of products) counts.set(p.categoryId, (counts.get(p.categoryId) ?? 0) + 1);
  const items = categories.map((c) => ({ id: c.id, name: c.name, count: counts.get(c.id) ?? 0 }));
  return (
    <div className="ui-cat-layout">
      <CategoryManager items={items} companyName={companyName} />
      <aside className="ui-cat-aside" aria-label="Cómo funcionan">
        <div className="ui-cat-how">
          <h2>CÓMO FUNCIONAN</h2>
          <ul>
            <li>
              <span aria-hidden="true">
                <Pencil />
              </span>
              <div>
                <strong>Renombrar</strong>
                <p>El cambio se aplica a todos sus productos al instante.</p>
              </div>
            </li>
            <li>
              <span aria-hidden="true">
                <Trash2 />
              </span>
              <div>
                <strong>Eliminar</strong>
                <p>Solo se puede eliminar una categoría vacía. Mueve antes sus productos a otra.</p>
              </div>
            </li>
          </ul>
        </div>
        <div className="ui-cat-stats">
          <StatTile label="Categorías" value={items.length} />
          <StatTile label="Productos" value={products.length} />
        </div>
      </aside>
    </div>
  );
}

export default function CategoriesPage() {
  return (
    <div className="stack">
      <PageHeader title="Categorías" description="Agrupan los productos en ventas y en el catálogo." />
      <Suspense fallback={<Loading />}>
        <CategoryScreen />
      </Suspense>
    </div>
  );
}
