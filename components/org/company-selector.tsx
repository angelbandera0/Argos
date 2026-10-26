"use client";

import { useTransition } from "react";
import { setActiveCompanyAction } from "@/app/(app)/companias/actions";

export function CompanySelector({
  companies,
  activeId,
}: {
  companies: { id: string; name: string }[];
  activeId?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="field">
      <label htmlFor="active-company">Compañía activa</label>
      <select
        id="active-company"
        className="input"
        value={activeId ?? ""}
        disabled={pending}
        onChange={(e) => start(() => setActiveCompanyAction(e.target.value))}
      >
        {!activeId && (
          <option value="" disabled>
            Elige una compañía
          </option>
        )}
        {companies.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
