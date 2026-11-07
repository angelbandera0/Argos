"use client";

import { useState } from "react";
import { createCategoryAction } from "@/app/(app)/catalogo/actions";
import { Plus, Search } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { CategoryRow } from "./category-row";
import { type CategoryItem, categoriesLabel, DUPLICATE_MESSAGE, filterCategories, isDuplicate } from "./category-list-logic";

export function CategoryManager({ items, companyName }: { items: CategoryItem[]; companyName?: string }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const toast = useToast();
  const shown = filterCategories(items, q);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (isDuplicate(name, items)) return setError(DUPLICATE_MESSAGE);
    setBusy(true);
    const fd = new FormData();
    fd.set("name", name);
    const r = await createCategoryAction({}, fd);
    setBusy(false);
    if (r.error || r.nameError) return setError(r.nameError ?? r.error);
    setName("");
    toast.success("Categoría agregada.");
  }

  return (
    <div className="ui-cat-main">
      <form className="ui-cat-add" aria-label="Nueva categoría" onSubmit={add}>
        <div className="ui-cat-add-field">
          <label className="sr-only" htmlFor="cat-new">
            Nombre de la nueva categoría
          </label>
          <Input
            id="cat-new"
            variant="outline"
            required
            maxLength={80}
            autoComplete="off"
            placeholder="Nueva categoría, ej. Frutas"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(undefined);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "cat-new-error" : undefined}
          />
          {error && (
            <p id="cat-new-error" className="ui-cat-error" role="alert">
              {error}
            </p>
          )}
        </div>
        <Button type="submit" loading={busy} disabled={!name.trim()} iconLeft={<Plus aria-hidden="true" />}>
          Agregar
        </Button>
      </form>
      <section className="ui-cat-card" aria-label={companyName ? `Categorías de ${companyName}` : "Categorías"}>
        <header className="ui-cat-head">
          <h2>{categoriesLabel(items.length)}</h2>
          <div className="search">
            <label className="sr-only" htmlFor="cat-search">
              Buscar categoría
            </label>
            <Search aria-hidden="true" />
            <Input id="cat-search" type="search" placeholder="Buscar categoría" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </header>
        {shown.length === 0 ? (
          <div className="ui-cat-empty">
            <strong>{items.length === 0 ? "Aún no hay categorías" : "Ninguna categoría coincide"}</strong>
            <span>{items.length === 0 ? "Agrega la primera arriba para poder crear productos." : "Prueba con otro nombre o créala arriba."}</span>
          </div>
        ) : (
          <ul aria-label="Categorías">
            {shown.map((c) => (
              <li key={c.id}>
                <CategoryRow item={c} all={items} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
