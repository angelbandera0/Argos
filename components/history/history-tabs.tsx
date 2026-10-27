"use client";

import { useRouter } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";
import { type HistoryFilters, filtersQuery } from "./history-utils";

export type HistoryTabItem = { value: string; label: string; count?: number };

/** Module tabs with counter; switching keeps the filters (except the action, which differs between sections). */
export function HistoryTabs({ items, current, filters }: { items: HistoryTabItem[]; current: string; filters: HistoryFilters }) {
  const router = useRouter();
  return (
    <Tabs
      aria-label="Módulo"
      items={items}
      value={current}
      onValueChange={(value) => {
        const crossing = (value === "accesos") !== (current === "accesos");
        router.push(`/historial/${value}${filtersQuery({ ...filters, actions: crossing ? [] : filters.actions })}`);
      }}
    />
  );
}
