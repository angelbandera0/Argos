import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Box, Plus, Search } from "@/components/icons";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { requireCatalogUser } from "../guard";
import Loading from "./loading";

export const instant = false;

export const metadata: Metadata = { title: "Productos · Argos" };

const STATUS = { activo: "Activo", inactivo: "Inactivo" } as const;

const NewLink = () => (
  <Link className="btn btn-primary" href="/catalogo/productos/nuevo">
    <Plus aria-hidden="true" />
    Nuevo producto
  </Link>
);

async function ProductList({ searchParams }: { searchParams: PageProps<"/catalogo/productos">["searchParams"] }) {
  const { actor, catalog, companyId, permissions } = await requireCatalogUser();
  if (!companyId) {
    return (
      <Card className="empty">
        <span className="icon-dot" aria-hidden="true">
          <Box />
        </span>
        <p>Elige una compañía arriba para ver sus productos.</p>
      </Card>
    );
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
      <Card className="empty">
        <span className="icon-dot" aria-hidden="true">
          <Box />
        </span>
        <p>Aún no hay productos. {permissions.create ? "Crea el primero para empezar a vender." : "Cuando se agreguen, aparecerán aquí."}</p>
        {permissions.create && <NewLink />}
      </Card>
    );
  }

  return (
    <Card>
      <form className="row" role="search">
        <div className="search">
          <label className="sr-only" htmlFor="q">
            Buscar producto
          </label>
          <Search aria-hidden="true" />
          <input id="q" name="q" type="search" defaultValue={qs} placeholder="Buscar por nombre" />
        </div>
        <label className="sr-only" htmlFor="categoria">
          Categoría
        </label>
        <select className="select" id="categoria" name="categoria" defaultValue={category} style={{ width: "auto" }}>
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <label className="sr-only" htmlFor="estado">
          Estado
        </label>
        <select className="select" id="estado" name="estado" defaultValue={status} style={{ width: "auto" }}>
          <option value="">Todos los estados</option>
          {Object.entries(STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <button className="btn btn-secondary" type="submit">
          Filtrar
        </button>
      </form>
      {shown.length === 0 ? (
        <p className="muted">Ningún producto coincide con la búsqueda.</p>
      ) : (
        <ul className="list" aria-label="Productos">
          {shown.map((p) => (
            <li key={p.id}>
              <Link className="list-row admin-row" href={`/catalogo/productos/${p.id}`}>
                <span className="icon-dot" aria-hidden="true">
                  <Box />
                </span>
                <span>
                  <strong>{p.name}</strong>
                  <br />
                  <span className="caption">{names.get(p.categoryId) ?? ""}</span>
                </span>
                <Chip variant={p.active ? "ring" : "neutral"}>{p.active ? "Activo" : "Inactivo"}</Chip>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default function ProductsPage(props: PageProps<"/catalogo/productos">) {
  return (
    <>
      <div className="topbar">
        <h1 className="page-title">Productos</h1>
        <span className="spacer" />
        <Suspense>
          <NewLinkIfAllowed />
        </Suspense>
      </div>
      <Suspense fallback={<Loading />}>
        <ProductList searchParams={props.searchParams} />
      </Suspense>
    </>
  );
}

async function NewLinkIfAllowed() {
  const { permissions, companyId } = await requireCatalogUser();
  return permissions.create && companyId ? <NewLink /> : null;
}
