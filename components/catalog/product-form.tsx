"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { checkProductNameAction, createCategoryAction, type CatalogActionState, saveProductAction } from "@/app/(app)/catalogo/actions";
import { ShoppingCart } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { buttonClass } from "@/components/ui/button-class";
import { Field, Input } from "@/components/ui/field";
import { FormSection } from "@/components/ui/form-section";
import { FormShell, FormSubmit } from "@/components/ui/form-shell";
import { SalesPreview } from "@/components/ui/sales-preview";
import { Select } from "@/components/ui/select";
import { Checklist, SummaryPanel } from "@/components/ui/summary-panel";
import { Textarea } from "@/components/ui/textarea";
import { ToggleCard } from "@/components/ui/toggle-card";
import { useToast } from "@/components/ui/toast";
import { blankProduct, descriptionCounter, MAX_DESCRIPTION, nameMessage, type NameStatus, nameStatusOf, productChecklist } from "./product-form-logic";

type Initial = { name: string; categoryId: string; description: string; active: boolean };

export function ProductForm({
  productId,
  initial,
  categories,
  canCreateCategory = false,
  readOnlyReason,
}: {
  productId: string | null;
  initial: Initial;
  categories: { id: string; name: string }[];
  canCreateCategory?: boolean;
  readOnlyReason?: string;
}) {
  const [state, action, pending] = useActionState<CatalogActionState, FormData>(saveProductAction.bind(null, productId), {});
  const toast = useToast();
  const locked = Boolean(readOnlyReason);
  const [values, setValues] = useState<Initial>(initial);
  const [extra, setExtra] = useState<{ id: string; name: string }[]>([]);
  const [touched, setTouched] = useState(false);
  const [checked, setChecked] = useState<{ name: string; available: boolean } | null>(null);
  const [handled, setHandled] = useState<number>();
  const [formKey, setFormKey] = useState(0);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newError, setNewError] = useState<string>();
  const [newBusy, setNewBusy] = useState(false);

  const cats = [...categories, ...extra.filter((e) => !categories.some((c) => c.id === e.id))];
  const category = cats.find((c) => c.id === values.categoryId);
  const trimmed = values.name.trim();
  const status: NameStatus = nameStatusOf(trimmed, productId ? initial.name.trim() : null, checked);
  const { items, complete } = productChecklist({ nameStatus: status, hasCategory: Boolean(category) });
  const counter = descriptionCounter(values.description.length);
  const set = (patch: Partial<Initial>) => setValues((v) => ({ ...v, ...patch }));

  useEffect(() => {
    if (locked || !trimmed || (productId && trimmed === initial.name.trim())) return;
    const t = setTimeout(async () => {
      const r = await checkProductNameAction(trimmed, productId);
      setChecked({ name: trimmed, available: r.available });
    }, 350);
    return () => clearTimeout(t);
  }, [locked, trimmed, productId, initial.name]);

  if (state.saved && state.saved !== handled) {
    setHandled(state.saved);
    setValues(blankProduct());
    setChecked(null);
    setTouched(false);
    setFormKey((k) => k + 1);
    toast.success("Producto guardado.");
  }

  async function createCategory() {
    const name = newName.trim();
    if (!name) return setNewError("Escribe el nombre de la categoría.");
    setNewBusy(true);
    setNewError(undefined);
    const fd = new FormData();
    fd.set("name", name);
    const r = await createCategoryAction({}, fd);
    setNewBusy(false);
    if (r.categoryId) {
      setExtra((e) => [...e, { id: r.categoryId as string, name }]);
      set({ categoryId: r.categoryId });
      setCreating(false);
      setNewName("");
    } else setNewError(r.nameError ?? r.error ?? "No se pudo crear la categoría.");
  }

  const nameError = nameMessage(status, touched) ?? state.nameError;

  return (
    <FormShell
      key={formKey}
      action={action}
      error={state.error}
      onSubmit={(e) => {
        if (locked || !complete) {
          e.preventDefault();
          setTouched(true);
        }
      }}
      aside={
        <SummaryPanel
          eyebrow="Así se verá en ventas"
          identity={
            <SalesPreview
              category={category?.name}
              name={trimmed}
              description={values.description.trim()}
              paused={!values.active}
            />
          }
          actions={
            locked ? (
              <Link className={buttonClass("secondary", "lg")} href="/catalogo/productos">
                Volver
              </Link>
            ) : (
              <>
                <FormSubmit label="Guardar producto" size="lg" pending={pending} disabled={!complete} />
                <Button type="submit" name="again" value="1" variant="secondary" size="lg" disabled={!complete || pending}>
                  Guardar y crear otro
                </Button>
                <Link className={buttonClass("ghost", "lg")} href="/catalogo/productos">
                  Cancelar
                </Link>
              </>
            )
          }
        >
          {!locked && <Checklist items={items} />}
        </SummaryPanel>
      }
    >
      {locked && <Alert variant="info">{readOnlyReason}</Alert>}
      <input type="hidden" name="categoryId" value={values.categoryId} />
      {values.active && <input type="hidden" name="active" value="on" />}

      <FormSection n={1} title="Datos del producto" description="Cómo se llama y dónde se encuentra en ventas.">
        <div className="ui-form-section-cols">
          <Field label="Nombre" htmlFor="name" hint="Así lo verá el cajero." error={nameError}>
            <Input
              id="name"
              name="name"
              maxLength={80}
              autoComplete="off"
              placeholder="Ej. Boniato"
              value={values.name}
              disabled={locked}
              onChange={(e) => set({ name: e.target.value })}
              onBlur={() => setTouched(true)}
              aria-invalid={nameError ? true : undefined}
              aria-describedby={nameError ? "name-error" : "name-hint"}
            />
          </Field>
          <div className="field">
            <div className="ui-user-label-row">
              <label htmlFor="categoryId">Categoría</label>
              {canCreateCategory && !locked && (
                <button type="button" className="ui-product-newcat" aria-expanded={creating} onClick={() => setCreating((c) => !c)}>
                  {creating ? "Elegir existente" : "+ Nueva categoría"}
                </button>
              )}
            </div>
            {creating ? (
              <>
                <div className="ui-product-newcat-row">
                  <Input
                    id="categoryId"
                    autoFocus
                    maxLength={80}
                    autoComplete="off"
                    placeholder="Nombre de la nueva categoría"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void createCategory();
                      }
                    }}
                    aria-invalid={newError ? true : undefined}
                    aria-describedby="newcat-hint"
                  />
                  <Button type="button" size="md" loading={newBusy} disabled={!newName.trim()} onClick={createCategory}>
                    Crear
                  </Button>
                </div>
                <span className={newError ? "error-text" : "hint"} id="newcat-hint" role={newError ? "alert" : undefined}>
                  {newError ?? "Se crea al instante y queda elegida."}
                </span>
              </>
            ) : (
              <>
                <Select
                  id="categoryId-select"
                  aria-label="Categoría"
                  options={cats.map((c) => ({ value: c.id, label: c.name }))}
                  placeholder="Elige una categoría"
                  value={values.categoryId || null}
                  onValueChange={(v) => set({ categoryId: v ?? "" })}
                  disabled={locked}
                  invalid={touched && !category}
                />
                <span className="hint">Agrupa el producto en la pantalla de venta.</span>
              </>
            )}
          </div>
        </div>
        <Field label="Descripción" htmlFor="description" optional>
          <Textarea
            id="description"
            name="description"
            variant="outline"
            rows={4}
            maxLength={MAX_DESCRIPTION}
            placeholder="Ej. Por libra. Variedad blanca"
            value={values.description}
            disabled={locked}
            onChange={(e) => set({ description: e.target.value })}
            aria-describedby="description-foot"
          />
          <div className="ui-product-desc-foot" id="description-foot">
            <span className="hint">Ayuda al cajero a distinguir productos parecidos.</span>
            <span className="ui-product-count" data-warn={counter.warn || undefined} aria-live="polite">
              {counter.text}
            </span>
          </div>
        </Field>
      </FormSection>

      <FormSection n={2} title="Disponibilidad" description="Puedes pausarlo cuando no haya existencias, sin borrarlo.">
        <ToggleCard
          checked={values.active}
          onCheckedChange={(active) => set({ active })}
          disabled={locked}
          icon={<ShoppingCart />}
          title={values.active ? "Activo" : "Inactivo"}
          description={values.active ? "Se ofrece en ventas desde que lo guardes" : "No se ofrece en ventas hasta que lo actives"}
        />
      </FormSection>
    </FormShell>
  );
}
