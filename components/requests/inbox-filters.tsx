"use client";

import { useRouter } from "next/navigation";
import { FilterBar } from "@/components/ui/filter-bar";
import { FilterSelect } from "@/components/ui/filter-select";
import { STATUS_OPTIONS } from "./inbox-logic";

const PATH = "/solicitudes/bandeja";

export function InboxFilters({ estado, tienda, stores }: { estado: string; tienda: string; stores: { value: string; label: string }[] }) {
  const router = useRouter();
  const go = (next: { estado: string; tienda: string }) => {
    const q = new URLSearchParams();
    if (next.estado) q.set("estado", next.estado);
    if (next.tienda) q.set("tienda", next.tienda);
    router.replace(q.size ? `${PATH}?${q}` : PATH, { scroll: false });
  };
  return (
    <FilterBar label="Filtros de la bandeja" onClear={estado || tienda ? () => router.replace(PATH, { scroll: false }) : undefined}>
      <FilterSelect label="Estado" options={STATUS_OPTIONS} value={estado} onValueChange={(v) => go({ estado: v, tienda })} />
      <FilterSelect label="Tienda" options={stores} value={tienda} onValueChange={(v) => go({ estado, tienda: v })} />
    </FilterBar>
  );
}
