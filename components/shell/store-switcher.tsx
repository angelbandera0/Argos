"use client";

import { useRef } from "react";
import { switchStore } from "@/app/(auth)/entrar/actions";

export type SwitcherStore = { id: string; name: string; site: string; available: boolean };

export function StoreSwitcher({ stores, activeId }: { stores: SwitcherStore[]; activeId: string }) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={switchStore} className="store-switcher">
      <label htmlFor="store-switcher" className="eyebrow">
        Tienda
      </label>
      <select
        id="store-switcher"
        name="storeId"
        className="select"
        defaultValue={activeId}
        onChange={() => form.current?.requestSubmit()}
      >
        {stores.map((s) => (
          <option key={s.id} value={s.id} disabled={!s.available}>
            {s.site} · {s.name}
            {s.available ? "" : " (No disponible: tienda desactivada)"}
          </option>
        ))}
      </select>
    </form>
  );
}
