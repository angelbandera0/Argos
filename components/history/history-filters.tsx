"use client";

import { useRouter } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { DateRangePicker } from "@/components/ui/datepicker";
import { FilterBar } from "@/components/ui/filter-bar";
import { FilterSelect } from "@/components/ui/filter-select";
import { CHANNELS, type HistoryFilters, filtersQuery, hasActiveFilters } from "./history-utils";

/** Filters apply on change: they go to the URL (and reset the paging). */
export function HistoryFilterBar({
  path,
  filters,
  people,
  actionOptions,
  actionLabel = "Acción",
}: {
  path: string;
  filters: HistoryFilters;
  people: { value: string; label: string }[];
  actionOptions: { value: string; label: string }[];
  actionLabel?: string;
}) {
  const router = useRouter();
  const go = (patch: Partial<HistoryFilters>) => router.replace(`${path}${filtersQuery({ ...filters, ...patch })}`, { scroll: false });
  return (
    <FilterBar label="Filtros del historial" onClear={hasActiveFilters(filters) ? () => router.replace(path, { scroll: false }) : undefined}>
      {people.length > 0 && (
        <FilterSelect
          label="Quién"
          options={people}
          emptyText="Todos"
          value={filters.actor ?? ""}
          onValueChange={(v) => go({ actor: v || undefined })}
          leading={(v) => <Avatar name={people.find((p) => p.value === v)?.label ?? "?"} />}
        />
      )}
      <FilterSelect multiple label={actionLabel} emptyText="Todas" options={actionOptions} value={filters.actions} onValueChange={(v) => go({ actions: v })} />
      <FilterSelect
        label="Canal"
        options={Object.entries(CHANNELS).map(([value, label]) => ({ value, label }))}
        value={filters.channel ?? ""}
        onValueChange={(v) => go({ channel: v || undefined })}
      />
      <DateRangePicker
        pill={{ label: "Fechas" }}
        value={{ from: filters.from ?? "", to: filters.to ?? "" }}
        onValueChange={(r) => go({ from: r.from || undefined, to: r.to || undefined })}
      />
    </FilterBar>
  );
}
