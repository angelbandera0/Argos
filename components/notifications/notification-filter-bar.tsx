"use client";

import { useRouter } from "next/navigation";
import { DateRangePicker } from "@/components/ui/datepicker";
import { FilterBar } from "@/components/ui/filter-bar";
import { FilterSelect } from "@/components/ui/filter-select";
import { MODULE_META, PRIORITY_META } from "./notification-logic";
import { OPERATIONS, hasActiveFilters, notificationsQuery, type NotificationFilters } from "./notification-filters-logic";

const toOptions = (r: Record<string, { label: string }> | Record<string, string>) =>
  Object.entries(r).map(([value, v]) => ({ value, label: typeof v === "string" ? v : v.label }));

const READ_OPTIONS = [
  { value: "unread", label: "Sin leer" },
  { value: "read", label: "Leídas" },
];

export function NotificationFilterBar({ filters, stores }: { filters: NotificationFilters; stores: { value: string; label: string }[] }) {
  const router = useRouter();
  const path = "/notificaciones";
  const go = (patch: Partial<NotificationFilters>) => router.replace(`${path}${notificationsQuery({ ...filters, page: 1, ...patch })}`, { scroll: false });
  return (
    <FilterBar label="Filtros de notificaciones" onClear={hasActiveFilters(filters) ? () => router.replace(path, { scroll: false }) : undefined}>
      <FilterSelect label="Módulo" emptyText="Todos" options={toOptions(MODULE_META)} value={filters.module ?? ""} onValueChange={(v) => go({ module: v || undefined })} />
      <FilterSelect label="Operación" emptyText="Todas" options={toOptions(OPERATIONS)} value={filters.operation ?? ""} onValueChange={(v) => go({ operation: v || undefined })} />
      <FilterSelect label="Prioridad" emptyText="Todas" options={toOptions(PRIORITY_META)} value={filters.priority ?? ""} onValueChange={(v) => go({ priority: v || undefined })} />
      <FilterSelect label="Estado" emptyText="Todas" options={READ_OPTIONS} value={filters.read ?? ""} onValueChange={(v) => go({ read: (v || undefined) as NotificationFilters["read"] })} />
      {stores.length > 0 && (
        <FilterSelect label="Tienda" emptyText="Todas" options={stores} value={filters.storeId ?? ""} onValueChange={(v) => go({ storeId: v || undefined })} />
      )}
      <DateRangePicker
        pill={{ label: "Fechas" }}
        value={{ from: filters.from ?? "", to: filters.to ?? "" }}
        onValueChange={(r) => go({ from: r.from || undefined, to: r.to || undefined })}
      />
    </FilterBar>
  );
}
