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
import { Chip } from "@/components/ui/chip";
import { DenominationRow } from "@/components/ui/denomination-row";
import { FormSection } from "@/components/ui/form-section";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import type { Denomination } from "@/core/application/ports/currency-repository";
import {
  activeSummary,
  addLocalDenomination,
  DUPLICATE_VALUE_MESSAGE,
  formatDenominationValue,
  hasValue,
  INVALID_VALUE_MESSAGE,
  KIND_OPTIONS,
  parseDenominationValue,
  removeLocalDenomination,
  sortDenominations,
  toggleLocalDenomination,
  updateLocalDenomination,
} from "./currency-form-logic";

type Result = { error?: string };

interface Ops {
  add: (value: number, kind: string) => Promise<Result> | Result;
  update: (id: string, value: number, kind: string) => Promise<Result> | Result;
  setActive: (id: string, active: boolean) => Promise<Result> | Result;
  remove: (id: string) => Promise<Result> | Result;
}

const onEnter = (fn: () => void) => (e: React.KeyboardEvent) => {
  if (e.key !== "Enter") return;
  e.preventDefault();
  fn();
};

function ValueInput({ symbol, ...props }: React.ComponentProps<typeof Input> & { symbol: string }) {
  return (
    <div className="ui-denomination-value">
      <Input inputMode="decimal" autoComplete="off" {...props} />
      <span aria-hidden="true">{symbol}</span>
    </div>
  );
}

function Row({ item, all, symbol, ops }: { item: Denomination; all: Denomination[]; symbol: string; ops: Ops }) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [value, setValue] = useState(String(item.value));
  const [kind, setKind] = useState<string>(item.kind);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const label = formatDenominationValue(item.value);

  async function run(fn: () => Promise<Result> | Result, done: string) {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    if (r.error) return setError(r.error);
    setError(undefined);
    toast.success(done);
    return true;
  }

  async function save() {
    const n = parseDenominationValue(value);
    if (n === null) return setError(INVALID_VALUE_MESSAGE);
    if (hasValue(all, n, item.id)) return setError(DUPLICATE_VALUE_MESSAGE);
    if (await run(() => ops.update(item.id, n, kind), "Denominación guardada")) setEditing(false);
  }

  const cancel = () => (setEditing(false), setError(undefined));

  if (editing) {
    return (
      <div className="ui-denomination-row" onKeyDown={(e) => e.key === "Escape" && cancel()}>
        <div className="ui-denomination-edit">
          <ValueInput
            symbol={symbol}
            aria-label={`Valor de ${label}`}
            autoFocus
            value={value}
            onChange={(e) => (setValue(e.target.value), setError(undefined))}
            onKeyDown={onEnter(save)}
            aria-invalid={error ? true : undefined}
          />
          <Select aria-label="Tipo" options={KIND_OPTIONS} value={kind} onValueChange={(v) => setKind(v ?? "bill")} />
          <Button variant="outline" onClick={cancel}>
            Cancelar
          </Button>
          <Button loading={busy} loadingLabel="Guardando…" onClick={save}>
            Guardar
          </Button>
          {error && (
            <p className="ui-cat-error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <DenominationRow value={item.value} symbol={symbol} kind={item.kind} inactive={!item.active} note={error}>
      <Button variant="ghost" size="sm" iconLeft={<Pencil aria-hidden="true" />} aria-label={`Editar ${label}`} onClick={() => setEditing(true)}>
        Editar
      </Button>
      <Switch
        label={item.active ? "Activa" : "Inactiva"}
        aria-label={`Activar ${label}`}
        checked={item.active}
        disabled={busy}
        onCheckedChange={(v) => run(() => ops.setActive(item.id, v), v ? "Denominación reactivada" : "Denominación desactivada")}
      />
      <button type="button" className="ui-cat-trash" aria-label={`Eliminar ${label}`} title={`Eliminar ${label}`} onClick={() => (setError(undefined), setConfirming(true))}>
        <Trash2 aria-hidden="true" />
      </button>
      <AlertDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={async () => {
          if (await run(() => ops.remove(item.id), "Denominación eliminada")) setConfirming(false);
        }}
        loading={busy}
        loadingLabel="Eliminando…"
        tone="danger"
        icon="Trash2"
        confirmLabel="Eliminar denominación"
        title={`¿Eliminar ${label}?`}
      >
        <p className="muted">La denominación dejará de aparecer en la lista.</p>
        {error && <Alert variant="danger">{error}</Alert>}
      </AlertDialog>
    </DenominationRow>
  );
}

/** Edit mode (currencyId set) persists each change with its own server action; create mode keeps `items` in the parent. */
export function DenominationManager({
  currencyId,
  items,
  symbol,
  onItemsChange,
}: {
  currencyId: string | null;
  items: Denomination[];
  symbol: string;
  onItemsChange: (items: Denomination[]) => void;
}) {
  const [value, setValue] = useState("");
  const [kind, setKind] = useState("bill");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const sorted = sortDenominations(items);
  const sym = symbol.trim();

  const ops: Ops = currencyId
    ? {
        add: (v, k) => addDenominationAction(currencyId, v, k),
        update: updateDenominationAction,
        setActive: setDenominationActiveAction,
        remove: deleteDenominationAction,
      }
    : {
        add: () => ({}),
        update: (id, v, k) => (onItemsChange(updateLocalDenomination(items, id, v, k)), {}),
        setActive: (id, a) => (onItemsChange(toggleLocalDenomination(items, id, a)), {}),
        remove: (id) => (onItemsChange(removeLocalDenomination(items, id)), {}),
      };

  async function add() {
    const n = parseDenominationValue(value);
    if (n === null) return setError(INVALID_VALUE_MESSAGE);
    if (hasValue(items, n)) return setError(DUPLICATE_VALUE_MESSAGE);
    if (!currencyId) {
      const r = addLocalDenomination(items, value, kind, crypto.randomUUID());
      if ("error" in r) return setError(r.error);
      onItemsChange(r.items);
      return setValue("");
    }
    setBusy(true);
    const r = await ops.add(n, kind);
    setBusy(false);
    if (r.error) return setError(r.error);
    setValue("");
    toast.success("Denominación añadida");
  }

  return (
    <FormSection
      n={2}
      title="Denominaciones"
      description="Billetes y monedas, de mayor a menor. Se usan para contar efectivo."
      aside={<Chip>{activeSummary(items)}</Chip>}
    >
      <div className="ui-denomination-add" role="group" aria-label="Nueva denominación">
        <ValueInput
          symbol={sym}
          aria-label="Valor de la denominación"
          placeholder="Valor"
          value={value}
          onChange={(e) => (setValue(e.target.value), setError(undefined))}
          onKeyDown={onEnter(add)}
          aria-invalid={error ? true : undefined}
        />
        <SegmentedControl
          aria-label="Tipo"
          options={KIND_OPTIONS}
          value={kind}
          onValueChange={(v) => setKind(String(v))}
        />
        <Button loading={busy} loadingLabel="Añadiendo…" onClick={add} iconLeft={<Plus aria-hidden="true" />}>
          Añadir
        </Button>
      </div>
      {error && (
        <p className="ui-cat-error" role="alert">
          {error}
        </p>
      )}
      {sorted.length === 0 && <p className="muted">Aún no hay denominaciones.</p>}
      {sorted.length > 0 && (
        <div className="ui-denomination-list">
          {sorted.map((d) => (
            <Row key={d.id} item={d} all={items} symbol={sym} ops={ops} />
          ))}
        </div>
      )}
    </FormSection>
  );
}
