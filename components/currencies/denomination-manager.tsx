"use client";

import { useState } from "react";
import {
  addDenominationAction,
  deleteDenominationAction,
  setDenominationActiveAction,
  updateDenominationAction,
} from "@/app/(app)/divisas/actions";
import { Pencil, Plus, Trash2 } from "@/components/icons";
import { Alert } from "@/components/ui/alert";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import type { Denomination } from "@/core/application/ports/currency-repository";
import {
  DUPLICATE_VALUE_MESSAGE,
  formatDenominationValue,
  hasValue,
  KIND_OPTIONS,
  kindLabel,
  parseDenominationValue,
  sortDenominations,
} from "./currency-form-logic";

const INVALID_VALUE = "Escribe un valor mayor que 0.";

function Row({ item, all }: { item: Denomination; all: Denomination[] }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [value, setValue] = useState(String(item.value));
  const [kind, setKind] = useState<string>(item.kind);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const label = formatDenominationValue(item.value);

  async function run(fn: () => Promise<{ error?: string }>, done: string) {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    if (r.error) return setError(r.error);
    setError(undefined);
    toast.success(done);
    return true;
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const n = parseDenominationValue(value);
    if (n === null) return setError(INVALID_VALUE);
    if (hasValue(all, n, item.id)) return setError(DUPLICATE_VALUE_MESSAGE);
    if (await run(() => updateDenominationAction(item.id, n, kind), "Denominación guardada")) setEditing(false);
  }

  if (editing) {
    return (
      <form
        className="ui-cat-row ui-cat-row-edit"
        onSubmit={save}
        onKeyDown={(e) => e.key === "Escape" && (setEditing(false), setError(undefined))}
      >
        <div className="ui-cat-edit-field">
          <label className="sr-only" htmlFor={`den-${item.id}`}>
            Valor de {label}
          </label>
          <Input
            id={`den-${item.id}`}
            variant="outline"
            inputMode="decimal"
            autoFocus
            autoComplete="off"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(undefined);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby={`den-${item.id}-note`}
          />
          <p id={`den-${item.id}-note`} className="ui-cat-error" role="alert" hidden={!error}>
            {error}
          </p>
        </div>
        <Select aria-label="Tipo" options={KIND_OPTIONS} value={kind} onValueChange={(v) => setKind(v ?? "bill")} />
        <Button variant="outline" onClick={() => (setEditing(false), setError(undefined))}>
          Cancelar
        </Button>
        <Button type="submit" loading={busy}>
          Guardar
        </Button>
      </form>
    );
  }

  return (
    <div className="ui-cat-row">
      <span className={`ui-den-shape ui-den-${item.kind}${item.active ? "" : " ui-den-off"}`} aria-hidden="true" />
      <div className="ui-cat-text">
        <strong>{label}</strong>
        <span className={error ? "ui-cat-error" : "ui-cat-note"} role={error ? "alert" : undefined}>
          {error ?? kindLabel(item.kind)}
        </span>
      </div>
      <Button variant="ghost" size="sm" iconLeft={<Pencil aria-hidden="true" />} aria-label={`Editar ${label}`} onClick={() => setEditing(true)}>
        Editar
      </Button>
      <Switch
        label={item.active ? "Activa" : "Inactiva"}
        aria-label={`Activar ${label}`}
        checked={item.active}
        disabled={busy}
        onCheckedChange={(v) => run(() => setDenominationActiveAction(item.id, v), v ? "Denominación reactivada" : "Denominación desactivada")}
      />
      <button type="button" className="ui-cat-trash" aria-label={`Eliminar ${label}`} title={`Eliminar ${label}`} onClick={() => (setError(undefined), setConfirming(true))}>
        <Trash2 aria-hidden="true" />
      </button>
      <AlertDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={async () => {
          if (await run(() => deleteDenominationAction(item.id), "Denominación eliminada")) setConfirming(false);
        }}
        loading={busy}
        tone="danger"
        icon="Trash2"
        confirmLabel="Eliminar denominación"
        title={`¿Eliminar ${label}?`}
      >
        <p className="muted">La denominación dejará de aparecer en la lista.</p>
        {error && <Alert variant="danger">{error}</Alert>}
      </AlertDialog>
    </div>
  );
}

export function DenominationManager({ currencyId, items }: { currencyId: string | null; items: Denomination[] }) {
  const [value, setValue] = useState("");
  const [kind, setKind] = useState("bill");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const sorted = sortDenominations(items);
  const locked = currencyId === null;

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const n = parseDenominationValue(value);
    if (!currencyId) return;
    if (n === null) return setError(INVALID_VALUE);
    if (hasValue(items, n)) return setError(DUPLICATE_VALUE_MESSAGE);
    setBusy(true);
    const r = await addDenominationAction(currencyId, n, kind);
    setBusy(false);
    if (r.error) return setError(r.error);
    setValue("");
    toast.success("Denominación añadida");
  }

  return (
    <FormSection
      n={3}
      title="Denominaciones"
      description={locked ? "Guarda la divisa para añadir denominaciones." : "Billetes y monedas, de mayor a menor. Se usan para contar efectivo."}
    >
      <form className="ui-cat-add" aria-label="Nueva denominación" onSubmit={add}>
        <div className="ui-cat-add-field">
          <label className="sr-only" htmlFor="den-new">
            Valor de la denominación
          </label>
          <Input
            id="den-new"
            inputMode="decimal"
            autoComplete="off"
            placeholder="Valor, ej. 0,5 o 20"
            disabled={locked}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(undefined);
            }}
            aria-invalid={error ? true : undefined}
            aria-describedby="den-new-error"
          />
          <p id="den-new-error" className="ui-cat-error" role="alert" hidden={!error}>
            {error}
          </p>
        </div>
        <Select aria-label="Tipo" options={KIND_OPTIONS} value={kind} onValueChange={(v) => setKind(v ?? "bill")} disabled={locked} />
        <Button type="submit" loading={busy} disabled={locked} iconLeft={<Plus aria-hidden="true" />}>
          Añadir
        </Button>
      </form>
      {!locked && sorted.length === 0 && <p className="muted">Aún no hay denominaciones.</p>}
      {sorted.length > 0 && (
        <div className="ui-cat-card">
          {sorted.map((d) => (
            <Row key={d.id} item={d} all={items} />
          ))}
        </div>
      )}
    </FormSection>
  );
}
