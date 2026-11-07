"use client";

import Link from "next/link";
import { useState } from "react";
import { deleteCategoryAction, renameCategoryAction } from "@/app/(app)/catalogo/actions";
import { Pencil, Tag, Trash2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  canDelete,
  type CategoryItem,
  DUPLICATE_MESSAGE,
  isDuplicate,
  LOCKED_TITLE,
  productsLabel,
  updateNote,
} from "./category-list-logic";

type Mode = "view" | "rename" | "delete";

export function CategoryRow({ item, all }: { item: CategoryItem; all: CategoryItem[] }) {
  const [mode, setMode] = useState<Mode>("view");
  const [value, setValue] = useState(item.name);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const icon = (
    <span className={`ui-cat-icon${item.count === 0 ? " ui-cat-icon-empty" : ""}`} aria-hidden="true">
      <Tag />
    </span>
  );

  function close() {
    setMode("view");
    setError(undefined);
    setValue(item.name);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (isDuplicate(value, all, item.id)) return setError(DUPLICATE_MESSAGE);
    setBusy(true);
    const fd = new FormData();
    fd.set("name", value);
    const r = await renameCategoryAction(item.id, {}, fd);
    setBusy(false);
    if (r.error || r.nameError) return setError(r.nameError ?? r.error);
    setMode("view");
    toast.success("Categoría renombrada.");
  }

  async function remove() {
    setBusy(true);
    const r = await deleteCategoryAction(item.id);
    setBusy(false);
    if (r.error) return setError(r.error);
    toast.success("Categoría eliminada.");
  }

  if (mode === "rename") {
    return (
      <form className="ui-cat-row ui-cat-row-edit" onSubmit={save} onKeyDown={(e) => e.key === "Escape" && close()}>
        {icon}
        <div className="ui-cat-edit-field">
          <label className="sr-only" htmlFor={`cat-${item.id}`}>
            Nuevo nombre de {item.name}
          </label>
          <Input
            id={`cat-${item.id}`}
            variant="outline"
            autoFocus
            required
            maxLength={80}
            autoComplete="off"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(undefined);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={`cat-${item.id}-note`}
          />
          <p id={`cat-${item.id}-note`} className={error ? "ui-cat-error" : "ui-cat-note"} role={error ? "alert" : undefined}>
            {error ?? updateNote(item.count)}
          </p>
        </div>
        <Button variant="outline" onClick={close}>
          Cancelar
        </Button>
        <Button type="submit" loading={busy} disabled={!value.trim()}>
          Guardar
        </Button>
      </form>
    );
  }

  if (mode === "delete") {
    return (
      <div className="ui-cat-row ui-cat-row-confirm" role="alertdialog" aria-labelledby={`cat-${item.id}-t`} aria-describedby={`cat-${item.id}-d`}>
        {icon}
        <div className="ui-cat-text">
          <strong id={`cat-${item.id}-t`}>¿Eliminar «{item.name}»?</strong>
          <span id={`cat-${item.id}-d`} className={error ? "ui-cat-error" : "ui-cat-note"}>
            {error ?? "No tiene productos. Quedará registrado en el historial."}
          </span>
        </div>
        <Button variant="outline" autoFocus onClick={close}>
          Cancelar
        </Button>
        <Button variant="danger" loading={busy} onClick={remove}>
          Eliminar
        </Button>
      </div>
    );
  }

  const locked = !canDelete(item);
  return (
    <div className="ui-cat-row">
      {icon}
      <div className="ui-cat-text">
        <strong>{item.name}</strong>
        {item.count > 0 ? (
          <Link className="ui-cat-count" href={`/catalogo/productos?categoria=${item.id}`}>
            {productsLabel(item.count)}
          </Link>
        ) : (
          <span className="ui-cat-note">{productsLabel(0)}</span>
        )}
      </div>
      <Button variant="ghost" size="sm" iconLeft={<Pencil aria-hidden="true" />} aria-label={`Renombrar ${item.name}`} onClick={() => setMode("rename")}>
        Renombrar
      </Button>
      <button
        type="button"
        className="ui-cat-trash"
        aria-label={`Eliminar ${item.name}`}
        title={locked ? LOCKED_TITLE : `Eliminar ${item.name}`}
        disabled={locked}
        onClick={() => setMode("delete")}
      >
        <Trash2 aria-hidden="true" />
      </button>
    </div>
  );
}
