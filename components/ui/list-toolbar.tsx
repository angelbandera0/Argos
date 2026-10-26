"use client";

import { NAV_ICONS } from "@/components/icons";
import { Button } from "./button";
import { Select, type SelectOption } from "./select";

const { Search } = NAV_ICONS;

export type ToolbarFilter = {
  name: string;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string | null) => void;
};

export function ListToolbar({
  search,
  filters = [],
  primary,
  submitLabel = "Filtrar",
  ...form
}: Omit<React.ComponentProps<"form">, "role" | "children"> & {
  search?: {
    name?: string;
    label: string;
    placeholder?: string;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
  };
  filters?: ToolbarFilter[];
  primary?: React.ReactNode;
  submitLabel?: string | false;
}) {
  return (
    <form className="list-toolbar" role="search" {...form}>
      {search && (
        <div className="search list-toolbar-search">
          <label className="sr-only" htmlFor={`${search.name ?? "q"}-search`}>
            {search.label}
          </label>
          <Search aria-hidden="true" />
          <input
            id={`${search.name ?? "q"}-search`}
            name={search.name ?? "q"}
            type="search"
            placeholder={search.placeholder}
            value={search.value}
            defaultValue={search.value === undefined ? search.defaultValue : undefined}
            onChange={search.onValueChange && ((e) => search.onValueChange?.(e.target.value))}
          />
        </div>
      )}
      {filters.map((f) => (
        <div key={f.name} className="list-toolbar-filter">
          <Select
            name={f.name}
            aria-label={f.label}
            options={f.options}
            placeholder={f.placeholder ?? f.label}
            value={f.value}
            defaultValue={f.value === undefined ? f.defaultValue : undefined}
            onValueChange={f.onValueChange}
          />
        </div>
      ))}
      {submitLabel !== false && (filters.length > 0 || search) && (
        <Button type="submit" variant="secondary">
          {submitLabel}
        </Button>
      )}
      {primary && <div className="list-toolbar-primary">{primary}</div>}
    </form>
  );
}
