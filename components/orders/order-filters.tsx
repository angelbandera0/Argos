"use client";


import { useNavRouter } from "@/components/ui/use-nav-router";
import { DateRangePicker } from "@/components/ui/datepicker";
import { FilterBar } from "@/components/ui/filter-bar";
import { FilterSelect } from "@/components/ui/filter-select";
import { ORDER_STATUS_OPTIONS } from "./order-logic";

const PATH = "/pedidos";

type F = { estado: string; comprador: string; desde: string; hasta: string };

export function OrderFilters({ buyers, ...f }: F & { buyers: { value: string; label: string }[] }) {
  const router = useNavRouter();
  const go = (next: Partial<F>) => {
    const all = { ...f, ...next };
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(all)) if (v) q.set(k, v);
    router.replace(q.size ? `${PATH}?${q}` : PATH, { scroll: false });
  };
  const active = !!(f.estado || f.comprador || f.desde || f.hasta);
  return (
    <FilterBar label="Filtros de pedidos" onClear={active ? () => router.replace(PATH, { scroll: false }) : undefined}>
      <FilterSelect label="Estado" options={ORDER_STATUS_OPTIONS} value={f.estado} onValueChange={(v) => go({ estado: v })} />
      {buyers.length > 0 && <FilterSelect label="Comprador" options={buyers} value={f.comprador} onValueChange={(v) => go({ comprador: v })} />}
      <DateRangePicker pill={{ label: "Fechas" }} value={{ from: f.desde, to: f.hasta }} onValueChange={(r) => go({ desde: r.from, hasta: r.to })} />
    </FilterBar>
  );
}
