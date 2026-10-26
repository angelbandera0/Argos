"use client";

import { startTransition } from "react";
import { switchStore } from "@/app/(auth)/entrar/actions";
import { Select } from "@/components/ui/select";

export type SwitcherStore = { id: string; name: string; site: string; available: boolean };

export function StoreSwitcher({ stores, activeId }: { stores: SwitcherStore[]; activeId: string }) {
  return (
    <div className="store-switcher">
      <label htmlFor="store-switcher" className="eyebrow">
        Tienda
      </label>
      <Select
        id="store-switcher"
        name="storeId"
        defaultValue={activeId}
        options={stores.map((s) => ({
          value: s.id,
          label: `${s.site} · ${s.name}`,
          disabled: !s.available,
          hint: s.available ? undefined : "No disponible: tienda desactivada",
        }))}
        onValueChange={(value) => {
          if (!value || value === activeId) return;
          const data = new FormData();
          data.set("storeId", value);
          startTransition(() => switchStore(data));
        }}
      />
    </div>
  );
}
