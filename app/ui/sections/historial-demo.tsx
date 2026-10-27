"use client";

import { useMemo, useState } from "react";
import { type AuditChange, type AuditRowData, AuditTable } from "@/components/ui/audit-table";
import { Avatar } from "@/components/ui/avatar";
import { DateRangePicker, type DateRange } from "@/components/ui/datepicker";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { FilterSelect } from "@/components/ui/filter-select";
import { PageHeader } from "@/components/ui/page-header";
import { Tabs } from "@/components/ui/tabs";
import { groupByDay } from "@/components/history/time-zone";

const NOW = new Date("2026-10-26T21:57:00Z");
const TZ = "America/Caracas";
const PEOPLE = [
  { value: "raul", label: "Raul R." },
  { value: "ana", label: "Ana Rodríguez" },
];
const ACTIONS = [
  { value: "create", label: "Creación" },
  { value: "update", label: "Edición" },
  { value: "delete", label: "Eliminación" },
];
const CHANNELS = [
  { value: "ui", label: "Web" },
  { value: "app", label: "App" },
  { value: "system", label: "Sistema" },
];
const VARIANT = { create: "success", update: "warning", delete: "danger" } as const;
const ICON = { ui: "Monitor", app: "Smartphone", system: "Settings" } as const;
const MODULES = { users: "Usuarios", products: "Productos" };

type Fake = { id: string; at: string; who: string | null; action: keyof typeof VARIANT; channel: keyof typeof ICON; module: keyof typeof MODULES; type: string; name: string; changes?: AuditChange[] };

const FAKE: Fake[] = [
  { id: "a1", at: "2026-10-26T21:41:12Z", who: "Raul R.", action: "update", channel: "ui", module: "users", type: "Usuario", name: "Ana Rodríguez", changes: [{ field: "role", before: "Cajero", after: "Administrador" }, { field: "stores", before: "La Casona", after: "La Casona, La Nación" }] },
  { id: "a2", at: "2026-10-26T21:02:03Z", who: "Raul R.", action: "create", channel: "ui", module: "users", type: "Usuario", name: "Pedro Gil", changes: [{ field: "username", before: "—", after: "k7m2.pedro" }] },
  { id: "a3", at: "2026-10-26T21:02:03Z", who: null, action: "create", channel: "system", module: "users", type: "Asignación de tienda", name: "Pedro Gil → La Casona" },
  { id: "b1", at: "2026-10-25T23:20:45Z", who: "Ana Rodríguez", action: "delete", channel: "app", module: "products", type: "Producto", name: "Té verde", changes: [{ field: "name", before: "Té verde", after: "—" }, { field: "price", before: "3", after: "—" }] },
  { id: "b2", at: "2026-10-25T13:03:10Z", who: "Raul R.", action: "update", channel: "ui", module: "products", type: "Producto", name: "Café molido", changes: [{ field: "price", before: "4.5", after: "5" }] },
];

const toRow = (f: Fake): AuditRowData => ({
  id: f.id,
  createdAt: f.at,
  actor: f.who,
  action: { label: ACTIONS.find((a) => a.value === f.action)!.label, variant: VARIANT[f.action] },
  module: MODULES[f.module],
  entity: { type: f.type, name: f.name, id: `${f.id}7c0e91d4-aaaa` },
  channel: { key: f.channel, label: CHANNELS.find((c) => c.value === f.channel)!.label, icon: ICON[f.channel] },
  changes: f.changes,
});

export const SAMPLE_GROUPS = groupByDay(FAKE.map(toRow), TZ, NOW);
export const SAMPLE_ROWS = FAKE.map(toRow);

function useFilters() {
  const [actor, setActor] = useState("");
  const [actions, setActions] = useState<string[]>([]);
  const [channel, setChannel] = useState("");
  const [range, setRange] = useState<DateRange>({ from: "", to: "" });
  const active = !!(actor || actions.length || channel || range.from);
  const clear = () => {
    setActor("");
    setActions([]);
    setChannel("");
    setRange({ from: "", to: "" });
  };
  return { actor, setActor, actions, setActions, channel, setChannel, range, setRange, active, clear };
}

function Bar({ f }: { f: ReturnType<typeof useFilters> }) {
  return (
    <FilterBar onClear={f.active ? f.clear : undefined}>
      <FilterSelect label="Quién" options={PEOPLE} value={f.actor} onValueChange={f.setActor} leading={(v) => <Avatar name={PEOPLE.find((p) => p.value === v)?.label ?? "?"} />} />
      <FilterSelect multiple label="Acción" emptyText="Todas" options={ACTIONS} value={f.actions} onValueChange={f.setActions} />
      <FilterSelect label="Canal" options={CHANNELS} value={f.channel} onValueChange={f.setChannel} />
      <DateRangePicker pill={{ label: "Fechas" }} today="2026-10-26" value={f.range} onValueChange={f.setRange} />
    </FilterBar>
  );
}

export function FiltrosDemo() {
  const f = useFilters();
  return <Bar f={f} />;
}

export function FiltrosEstados() {
  return (
    <FilterBar onClear={() => {}}>
      <FilterSelect label="Canal" options={CHANNELS} value="" onValueChange={() => {}} />
      <FilterSelect label="Quién" options={PEOPLE} value="raul" onValueChange={() => {}} leading={() => <Avatar name="Raul R." />} />
      <FilterSelect multiple label="Acción" emptyText="Todas" options={ACTIONS} value={["create", "update"]} onValueChange={() => {}} />
      <DateRangePicker pill={{ label: "Fechas" }} today="2026-10-26" value={{ from: "2026-10-20", to: "2026-10-26" }} onValueChange={() => {}} />
    </FilterBar>
  );
}

export function AvataresDemo() {
  return (
    <div className="row">
      <Avatar name="Raul R." />
      <Avatar name="Ana Rodríguez" />
      <Avatar name="Pedro Gil" />
      <Avatar name="Luis Martín" />
      <Avatar name="Sistema" system />
      <Avatar name="Raul R." size="md" />
    </div>
  );
}

export function HistorialCompleto() {
  const f = useFilters();
  const [tab, setTab] = useState("todos");
  const rows = useMemo(
    () =>
      FAKE.filter(
        (r) =>
          (tab === "todos" || r.module === tab) &&
          (!f.actor || PEOPLE.find((p) => p.value === f.actor)?.label === r.who) &&
          (!f.actions.length || f.actions.includes(r.action)) &&
          (!f.channel || f.channel === r.channel) &&
          (!f.range.from || (r.at.slice(0, 10) >= f.range.from && r.at.slice(0, 10) <= f.range.to)),
      ).map(toRow),
    [tab, f.actor, f.actions, f.channel, f.range],
  );
  const groups = groupByDay(rows, TZ, NOW);
  return (
    <div className="stack">
      <PageHeader title="Historial" description="Operaciones registradas, de la más reciente a la más antigua." />
      <Tabs
        aria-label="Módulo"
        value={tab}
        onValueChange={setTab}
        items={[
          { value: "todos", label: "Todos", count: FAKE.length },
          { value: "users", label: "Usuarios", count: FAKE.filter((r) => r.module === "users").length },
          { value: "products", label: "Productos", count: FAKE.filter((r) => r.module === "products").length },
        ]}
      />
      <Bar f={f} />
      <AuditTable
        label="Historial de operaciones"
        groups={groups}
        showModule={tab === "todos"}
        empty={<EmptyState icon="Search" title="Ninguna operación coincide con los filtros.">Prueba con otros filtros o límpialos.</EmptyState>}
        footer={<span>{rows.length} {rows.length === 1 ? "operación" : "operaciones"} en esta página</span>}
      />
    </div>
  );
}
